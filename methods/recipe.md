# Methods are powerful yet easily overused

[Demo TBD](#) - [Source TBD](#)

----------

Methods provide a powerful capability to Meteor applications that is needed for certain complex functions.  However, method code does not follow the same rules as the rest of a Meteor application and conducting simple operations like inserts via methods brings about problems.  These considerations make methods considered powerful and neccesary but problematic in certain situations.

----------


## Common issues when using methods

### Allow/deny rules do not apply to method code

A common situation is that developers remove the `insecure` package and define some allow and deny rules that control the ability to perform insert/update/remove operations on the collections within their applications.  If the developer used methods as the mechaism for perfroming these operations, rather than directly using the insert/update/remove abilities directly from client code, they will likely be suprised to learn that the allow/deny rules have had no effect at all.

This is beahavor is quite clear in the the [Meteor Docs on Collection.allow](http://docs.meteor.com/#allow)
"Server code is trusted and isn't subject to allow and deny restrictions. That includes methods that are called with Meteor.call — they are expected to do their own access checking rather than relying on allow and deny."  However, this is a very easy detail to miss.


Let's say we have a collection with allow rules like so:
```
//lib/collections.js
Objects = new Meteor.Collection('objects');

Objects.allow({
  //allow users to conduct all operations on documents they own, as indicated via the userId property
  insert: function(userId, doc) {
    return userId && doc && userId === doc.userId;
  },
  update: function(userId, doc, fieldNames, modifier) {
    return userId && doc && userId === doc.userId;
  },
  remove: function(userId, doc) {
    return userId && doc && userId === doc.userId;
  },
  fetch: ['userId']
});
```
Nothing too special here.  Just a basic collection with rules that allow users to only perform operations on their own documents.


So now let's introduce an insert feature via a method call
```
//client/object.js
Template.objects.events({
	'click #insert':function(){
		var objectProps = {
			...//gather data from inputs, session, user, etc
		};
		Meteor.call('createObject', objectProps, function(error, result){
			//result has method response, the _id of the new object in this case
		});
	}
});

//lib/methods.js
Meteor.methods({
	createObject: function (objectProps) {
		...//optionally alter or inspect the object
		objectProps.createdAt = new Date();
		return Objects.insert(objectProps);
	}
});
```

Compare the method based approach a more simplified event localized approach
```
//client/object.js
Template.object.events({
	'click #insert':function(){
		var objectId = Objects.insert({
			...//gather data from inputs, session, user, etc
		});
	}
});
```

Both of these approaches perform an insert, but only the non-method based approach follows the allow rules we have defined.  This means that using a method like this, that doesnt define its own validation and access controls, a user could insert a document that with the userId of another user.  Also, if this example was extended to show update and remove operations, users would be able to update and remove the documents of another user simply by calling the method with the correct parameters.

You may think that it is nessecary to perform insert or update operations via methods to ensure that you can have accurate values for properties like `createdAt` or `updatedAt` which where generated on the server, but these can easily be accomplised with the [collection-hooks package](https://atmospherejs.com/package/collection-hooks). 

```
// server/hooks.js
Objects.before.insert(function(userId, doc){
	doc.createdAt = new Date();
});
Objects.before.update(function (userId, doc, fieldNames, modifier, options) {
	modifier.$set.updatedAt = new Date();
});
```
Using hooks like this to certain properties were generated server side provides a cleaner and less profuse way of performing simple insert/update operations.


### Document inserts done via methods can result in a 'double insert flicker'

Let's say we have a simple template that displays all of the items in our collection

```
// client/views/objects.html
<template name="objects">
<button id="insert">Insert New Object</button>
{{#each objects}}
	<div>
	    {{name}} -- {{createdAt}}  <!-- print out some properties of the object -->
	</div>
{{/each}}
</template>
```

The objects cursor that is sent to the template is sorted by the time of object creation, newest first
```
Template.objects.helpers({
	'objects':function(){
		return Objects.find({},{sort:{createdAt:-1}});
	}
});
```

If we have controller code that inserts a new object via a method call, we'll get 2 new items in the list for just moment before the client side inserted one is removed.
```
//client/object.js
Template.object.events({
	'click #insert':function(){
		var objectProps = {
			...//gather data from inputs, session, user, etc
		};
		Meteor.call('createObject', objectProps, function(error, result){
			//result has method response, the _id of the new object in this case
		});
	}
});

//lib/methods.js
Meteor.methods({
	createObject: function (objectProps) {
		...//optionally alter or inspect the object
		objectProps.createdAt = new Date();
		return Objects.insert(objectProps);
	}
});
```

So why do we see two new inserts then one is removed?  Because the method code is placed in the `lib` folder, which means that it will be available for execution on both the client and server.  The client execution will be a `stub` that will perform an insert, but when the server execution returns its result, that result will be written to the local cache, which may cause a redraw.

This 'double insert flicker' can be eliminated via one of two simple changes.

#### Generate _id property before calling method
```
Template.object.events({
	'click #insert':function(){
		var objectProps = {
			_id:Random.id(),
			...//gather data from inputs, session, user, etc
		};
		Meteor.call('createObject', objectProps, function(error, result){
			//result has method response, the _id of the new object in this case
		});
	}
});
```
This simple change will now ensure that the client and server both have the same _id attribute.  While you may still notice some redraws when the server returns its results, you will no longer see 2 inserted objects turning into 1 object.

#### Do not make method accessible to client for stub execution
You can have your method code be not accessible to the client by just having the methods.js file in the 'server' (server/methods.js) directory instead of the 'lib' directory (lib/methods.js).  This may not be desirable though as you will effectivly lose the 'latency compensation' feature that makes meteor apps feel so fast.  Since your method is no longer defined on the client, your template must wait to redraw until the server has responded with its results.  This is barely noticeable when doing local development, but quite noticable on a production hosting setup where the server is not the same machine as the client. 



---


### What are some examples of methods usage that is appropriate or inappropriate?

Excellent or required usage of methods:
* Remote file operations on a storage service (delete a file from S3)
* API calls with sensitive parameters (triggering a video encode on Zencoder with secret api key)
* Performing change propegation on data the client may not have access to (a user changes their name, which you have denormalized onto many collections/objects)
* Orchestrating a complex interaction of any kind (multiple data updates, sequential api calls, etc)


Usually undesirable usage of methods:
* Wrapping simple crud operations to occur on the server (send properties to method, method does insert/update)


----


## Should you use methods in your app?

Yes you should as methods are powerful and serve a very real purpose in even slightly complex applications.  However, for simple applications and framework newcomers they present problems that should discourage their usage for basic operations.  Therefore, it is reccommended that methods are avoided unless they are determined to be needed for a specific use case.  Most applications can be constructed by using the rather capable helper methods for insert/update/remove and allow/deny rules to make data editing straightforward and easy to understand.


### TODO
* using check to have complex validation
* demo application, what should it do? highlight the allow/deny problem?  show an advanced use case like querying s3?