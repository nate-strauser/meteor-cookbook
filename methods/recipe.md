# Methods Considered Dangerous

 you have choices - here’s how with allow/deny - here’s how with methods — signs that you should be using a method (multiple updates, transactions, etc)



 ---

 if your app is simple, stay away from methods until you

 start without methods, do not start with methods

 you may need to develop methods for certain functions of complex apps, but for most cases this is overkill

 ---

 common anti-pattern

 objProps = {...}

 Meteor.call('createObject', objectProps, ...)


 createObject = function(props){

 	....

 	return Objects.insert({props});
}


vs doing insert right in event handler in client code

**

why methods are dangerous:
allow/deny does not apply in method code - each method is responsible for its own security and access controls
if your methods of available in both client and server code, you'll notice items will appear then disappear then reappear or appear double then one goes away - what is happening here is that both client and server are inserting the new doc, then the one from the client method stub is being removed as the true record came from the server -- this can be mitigated by picking the id property and passing it to the method



why methods are powerful:
centralized and tighter control over certain actions - could even use allow/deny to prevent all non-method edits
if you have a complex scenario of edit (like a transaction) - certain cases of multiple updates might be best triggered via cursor observes or something like the collection-hooks package (user sets their name in a profile, you want to propegate that change) 



----