# Methods, Powerful But Dangerous

[Demo](#) - [Source](#)

----------

Methods provide a powerful capability to Meteor applications that is needed for certain complex functions.  However, method code does not follow the same rules as the rest of a Meteor application and conducting simple operations like inserts via methods brings about problems that can befuddle or frustrate novice/intermediate developers.  These considerations make methods considered powerful but dangerous.

----------

you have choices - here’s how with allow/deny - here’s how with methods — signs that you should be using a method (multiple updates, transactions, etc)



---

if your app is simple, stay away from methods until you

start without methods, do not start with methods

you may need to develop methods for certain functions of complex apps, but for most cases this is overkill

---

### Anti-Pattern of using methods for simple inserts

Consider the follow code that is technically correct, method based approach
```
//lib/collections.js
Objects = new Meteor.Collection('objects');

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
		return Objects.insert(objectProps);
	}
});
```

Compare the method based approach a more simplified event localized approach
```
//lib/collections.js
Objects = new Meteor.Collection('objects');

//client/object.js
Template.object.events({
	'click #insert':function(){
		var objectId = Objects.insert({
			...//gather data from inputs, session, user, etc
		});
	}
});
```

Some pro/cons to these approaches....
Event Localized:

Pro:
Less code
Uses built in conveince method (insert)
Respects allow/deny rules

Con:
No oppurtunity to rely on server side integrity for things like dates (but can be mititgated with packages)


Method based:

Pro:
Guarnteed server side execution (things like dates can't be tampered with)

Con:
More code
Passing of parameters, errors, and results back and forth
Double insert 'flicker' if method is on both client and server (if you dont generate the _id property)
Does not follow defined allow/deny rules


### Methods do not respect allow/deny rules

Consider the follow code...
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

//client/object.js
Template.object.events({
	'click #delete':function(){
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
		return Objects.insert(objectProps);
	}
});
```

Compare the method based approach a more simplified event localized approach
```
//lib/collections.js
Objects = new Meteor.Collection('objects');

//client/object.js
Template.object.events({
	'click #insert':function(){
		var objectId = Objects.insert({
			...//gather data from inputs, session, user, etc
		});
	}
});
```


----

why methods are dangerous:
allow/deny does not apply in method code - each method is responsible for its own security and access controls
if your methods of available in both client and server code, you'll notice items will appear then disappear then reappear or appear double then one goes away - what is happening here is that both client and server are inserting the new doc, then the one from the client method stub is being removed as the true record came from the server -- this can be mitigated by picking the id property and passing it to the method



why methods are powerful:
centralized and tighter control over certain actions - could even use allow/deny to prevent all non-method edits
if you have a complex scenario of edit (like a transaction) - certain cases of multiple updates might be best triggered via cursor observes or something like the collection-hooks package (user sets their name in a profile, you want to propegate that change) 



----


## The Final Word

Methods are powerful and serve a purpose in complex applications.  However, for simple applications and framework newcomers they present problems that outweigh their beneifts.  Therefore, it is reccommended that methods are avoided unless they are determined to be needed for a specific use case.  Most applications can be constructed by using the 


### TODO
* demo application, what should it do? highlight the allow/deny problem?  show an advanced use case like querying s3?