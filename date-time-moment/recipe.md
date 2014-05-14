# Storing and Displaying Dates With Time Using MomentJS

Dates and times are vital to almost all applications and can be quite tricky to deal with.  Fortunely, using moment and some other packages can make it almost too easy in your meteor apps.

## How should dates be stored in my objects?

You have a couple options that on the surface seem roughly equilvalent:


how to store the object
timestamp
string
date**

important point is that any date stored has these properties:
1) it can be trusted to be accurate and not manipulated
2) it specifies an exact time without any ambiguity
--- a timestamp meets this criteria as it is a number of seconds
--- a unix timestamp meets this criteria as number of milliseconds since epoch
--- a javascript date object specifys date, time, and importantly the timezone

storing as a date is most versitile as it can be used directly in map reduce mongo queries

could do some measurement to determine the performance of each solution - thinking date would come out 1st or 2nd - timestamp requires parsing but uses less space

--

moment knows what time zone your device is set to

try it out in the dev console when browsing momentjs.com
```
moment().zone()
```

If you are in EDT, you'll get 240.  EST, 300.  PDT, 420. PST, 480.  etc....


If you want to test this out, disable any automatic setting of time or timezone, change the timezone on your device, close and relaunch your browser, then run the above code in the console



--

Daylight savings time, oh my

--


client side dates may be incorrect or manipulated


- use methods

```
var Things = new Collection('things');
if (Meteor.isClient) {
  Template.thing.events({
    'click #createNewThing': function () {
      var thingProps = {
        name:'My New Thing'
  };

      Meteor.call('createNewThing', function(error, result){
        ....

        var thingId = result;
        ....
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.methods({
      createNewThing: function (props) {
        props.createdAt = new Date();
        return Things.insert(props);
      }
    });
  });
}
```

This will ensure that the property `createdAt` is set on the server (using server time), right before insertion.  Any inserts that happen to not use this method, may not have the correct date or even have the date at all.


- use collection2
```
Things = new Meteor.Collection("things", {
    schema: new SimpleSchema({
        name:{
        	type:String
    	},
    	//
    	// ... other schema properties ...
    	//

        // Force value to be current date (on server) upon insert
        // and prevent updates thereafter.
        createdAt: {
            type: Date,
            autoValue: function() {
                if (this.isInsert) {
                    return new Date();
                } else if (this.isUpsert) {
                    return {$setOnInsert: new Date()};
                } else {
                    this.unset();
                }
            },
            denyUpdate: true
        },
        // Force value to be current date (on server) upon update
        // and don't allow it to be set upon insert.
        updatedAt: {
            type: Date,
            autoValue: function() {
                if (this.isUpdate) {
                    return new Date();
                }
            },
            denyInsert: true,
            optional: true
        }
    })
});

if (Meteor.isClient) {
  Template.thing.events({
    'click #createNewThing': function () {
      var thingProps = {
        name:'My New Thing'
  };

      var thingId = Things.insert(thingProps)
    }
  });
}
```
In this pattern we do the insert right from the client side, which simplifies our code a good bit.  From the collection2 docs we can learn that even though the autovalue is defined and executed on both client and server, 'the actual value saved will always be generated on the server'.  We also have the added benefit here of always having a correct createdAt and updatedAt date for this any object in this collection.

- use collection hooks
```
Things = new Meteor.Collection("things");

if (Meteor.isClient) {
  Template.thing.events({
    'click #createNewThing': function () {
      var thingProps = {
        name:'My New Thing'
  };

      var thingId = Things.insert(thingProps)
    }
  });
}

if (Meteor.isServer) {
  Things.before.insert(function(userId, doc){
	  doc.createdAt = new Date();
	});
	Things.before.update(function (userId, doc, fieldNames, modifier, options) {
	  modifier.$set.updatedAt = new Date();
	});
}
```
This pattern gives ensures our objects have the correct date without defining a schema like with collection2.  Care must be taken to ensure that the hook is executing in the correct location. Without the `Meteor.isServer` wrapper or placing the code in the `server/` folder of your app, you could be using the date from the client.  This option also provides that any insert or update will have the correct server time appended to the operation.



----


how to display times in correct local timezone for any user
http://michaelapproved.com/articles/timezone-detect-and-ignore-daylight-saving-time-dst

assuming you have a property `createdAt` as specified above, you can display the date in the correct format for any user in any timezone quite easily with a helper method

```
UI.registerHelper("localizedDateAndTime", function(date) {
	if(date)
		return moment(date).format('l LT'); // "5/23/2014 3:47 PM"
});
```

You can then use this helper method in your template
```
{{#each things}}
   Name: {{name}}
   <br>
   Created At: {{localizedDateAndTime createdAt}}
{{/each}}
```



what about textual relative time display?

```
UI.registerHelper("timeFromNow", function(date) {
	if(date)
		return moment(date).fromNow(); // "a day ago"
});

UI.registerHelper("calendarTime", function(date) {
	if(date)
		return moment(date).calendar(); // "Yesterday 2:30 PM"
});

```
