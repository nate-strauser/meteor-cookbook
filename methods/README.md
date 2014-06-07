# Methods 

----------

Methods provide a powerful capability to Meteor applications that is needed for certain complex functions.  However, as method code executes server side, it does not follow the same rules as the client side portion of a Meteor application and conducting simple operations like inserts via methods brings about problems.  These considerations make methods considered powerful and necessary but problematic in certain situations.

----------


## Common issues when using methods

Many developers working on their first meteor application seem to have the misconception that everything should be done via a method, no matter how simple the operation.  While it is technically possible and correct to build an application in this manner, the are some concerns and issues that become apparent over time.

### Allow and deny rules do not apply to methods

A common situation is that developers remove the `insecure` package and define some allow and deny rules that control the ability to perform insert/update/remove operations on the collections within their applications.  If the developer used methods as the mechanism for performing these operations, rather than directly using the insert/update/remove abilities from client code, they will likely be surprised to learn that the allow/deny rules have had no effect at all.

This is behavior is quite clear in the the [Meteor Docs on Collection.allow](http://docs.meteor.com/#allow) 
"Server code is trusted and isn't subject to allow and deny restrictions. That includes methods that are called with Meteor.call — they are expected to do their own access checking rather than relying on allow and deny."  
However, such an important detail is a very easy to miss.


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

Both of these approaches perform an insert, but only the non-method based approach follows the allow rules we have defined.  This means that using a method like this, that does not define its own validation and access controls, a user could insert a document that with the userId of another user.  Also, if this example was extended to show update and remove operations, users would be able to update and remove the documents of another user simply by calling the method with the correct parameters.

Of course you could define your own access controls within each method, but you have to define allow/deny rules to defend against a user making custom operation call via the javascript console.  If you already have these rules, why not structure your application in such a way that they are actually leveraged, thereby reducing the amount of written code and decreasing application complexity.

#### Ensuring server side properties without using methods
You may think that it is necessary to perform insert or update operations via methods to ensure that you can have accurate values for properties like `createdAt` or `updatedAt` which where generated on the server, but these can easily be accomplished with the [collection-hooks package](https://atmospherejs.com/package/collection-hooks). 

```
// server/hooks.js
Objects.before.insert(function(userId, doc){
	doc.createdAt = new Date();
});
Objects.before.update(function (userId, doc, fieldNames, modifier, options) {
	modifier.$set.updatedAt = new Date();
});
```
Using hooks like this to ensure that certain properties were generated server side provides a cleaner and less profuse way of performing simple insert/update operations.

------

### What are some examples of methods usage that is appropriate or inappropriate?

Excellent or required usage of methods:
* Remote file operations on a storage service (delete a file from S3)
* API calls with sensitive parameters (triggering a video encoding service with secret api key)
* Performing change propagation on data the client may not have access to (a user changes their name, which you have denormalized onto many collections/objects)
* Orchestrating a complex interaction of any kind (multiple data updates, sequential api calls, etc)


Usually undesirable usage of methods:
* Wrapping simple insert/update/remove operations to occur on the server (send properties to method, method does insert/update)


----


## Should you use methods in your app?

Yes, you should, as methods are powerful and serve a very real purpose in even slightly complex applications.  However, for simple applications and framework newcomers they present problems that should discourage their usage for basic operations.  Therefore, it is recommended that methods are avoided unless they are determined to be needed for a specific use case.  Most applications can be constructed by using the rather capable helper methods for insert/update/remove and allow/deny rules to make data editing straightforward and easy to understand.


### TODO
* using check to have complex validation
* data propagation example - easier with collection hooks
* demo application, what should it do? highlight the allow/deny problem?  show an advanced use case like querying s3?
