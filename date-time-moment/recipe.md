# Dates/Times with MomentJS

Dates and times are vital to almost all applications and can be quite tricky to properly utilize.  Fortunately, by using moment and some other packages you can make it quite simple for your meteor applications.

----------

Example application running at http://date-time-moment.meteor.com/ with code at https://github.com/nate-strauser/meteor-cookbook/tree/master/date-time-moment/date-example

----------

## What are important criteria of Date properties?

1. Dates must specify an exact time without any ambiguity
2. Dates must be trusted to be accurate, consistent, and not manipulated

## How should dates be stored in my objects?

The format of the property allows it to meet criteria #1 by the inherit qualities of that representation.

The two most common options that are roughly equivalent are as a Date object or a Unix Offset

**As a Date object**
```
var date = new Date();
// date -> Wed May 14 2014 14:03:28 GMT-0700 (UTC)
```
A Date object clearly meets criteria #1 as it specifies date, time, and importantly the timezone.


**As a number**
```
var date = Date.now();
// date -> 1400101308998
```
An offset meets criteria #1 as it is a number of milliseconds since epoch (1 January 1970 00:00:00 UTC), from which you can calculate date, time, and adjust for timezone. A timestamp is very similar expect that it is seconds since epoch, rather than milliseconds.


#### Which format should you use?

Technically either is acceptable, but using a Date object is slightly superior.

* Date objects are human readable directly from mongo
* Date objects can be used directly in map reduce mongo queries

A follow on activity here could be a performance evaluation of numerical offsets versus Date objects.  Offsets do have some storage and bandwidth advantages, which in certain applications may balance well against the burden of parsing.

#### What about storing as a string?

It's also quite possible to store a date as a string, either a string of the date object or the offset/timestamp.  Strings don't give you any worthwhile benefit over a date or number, but do provide several disadvantages to utilization and performance, thus storing as a string is not recommended.  Also, depending on exactly what the format of the string is, you may not meet criteria #1 (eg "Wed May 14 2014 14:03:28" has no timezone and thus is ambiguous)

### How can you ensure your dates are accurate, consistent, and not manipulated?

The main problem here is that any date which is construct in the browser is using the time and date of the operating system.  If your application takes dates directly from the browser, then you are vulnerable to a user simply changing the date or time on their device.  Even if your users are not actively trying to provide you with an incorrect date, you must still account for incorrect times on devices.  Essentially, the date and time of any device can not be trusted, thus is it necessary to only utilize the date and time of your server.

You can use the following techniques and packages to meet criteria #2 of date properties
* Methods
* collection2
* collection-hooks

#### [Methods](http://docs.meteor.com/#methods_header)

```
var Things = new Collection('things');
if (Meteor.isClient) {
  Template.thing.events({
    'click #createNewThing': function () {
      var thingProps = {
        name:'My New Thing'
      };

      Meteor.call('createNewThing', thingProps, function(error, result){
        var thingId = result;
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      createNewThing: function (props) {
        props.createdAt = new Date();
        return Things.insert(props);
      }
    });
  });
}
```

This will ensure that the property `createdAt` is set on the server (using server time), right before insertion.  Any inserts that do not use this method, may not have the correct date or even have the date at all.


#### [collection2](https://github.com/aldeed/meteor-collection2#autovalue)
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
      var thingId = Things.insert({
        name:'My New Thing'
      });
    }
  });
}
```
In this pattern we do the insert right from the client side, which simplifies our code a good bit.  From the collection2 docs we can learn that even though the autovalue is defined and executed on both client and server, 'the actual value saved will always be generated on the server'.  We also have the added benefit here of always having a correct createdAt and updatedAt date for this any object in this collection.

#### [collection-hooks](https://github.com/matb33/meteor-collection-hooks/#beforeinsertuserid-doc)
```
Things = new Meteor.Collection("things");

if (Meteor.isClient) {
  Template.thing.events({
    'click #createNewThing': function () {
      var thingId = Things.insert({
        name:'My New Thing'
      });
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

#### Which of these should you use?

Any of the options will meet the need, but collection-hooks has a slight leg up.

* collection-hooks provides the least intrusive option for ensuring date integrity.  It shares the **always correct** qualities of collection2 autovalue fields, without having to define your data schema.  collection-hooks can be used in conjunction with methods and/or collection2.
* collection2 is very powerful and especially useful in conjunction with autoform.  However, defining a data schema is not always desirable.
* methods can be used to meet date integrity needs, however special care must be taken to not circumvent your own methods.  Methods also have special properites in comparision to non-method code and thus should be reserved for advanced use cases.

-----------

## How do you display dates in your application?

Enter [moment.js](http://www.momentjs.com)

Moment is a very powerful library for parsing, formatting, and manipulating dates.  If you've worked with dates in the past, you know how painful and tricky it can be to get what you want from a date.  Moment makes all common date operations quite easy and straightforward.


#### What about time zones and daylight savings time?

Moment can automatically detect what time zone your device is set to as well as wether or not daylight savings time is in effect. Try it out in the dev console when browsing momentjs.com
```
moment().zone()
```
This returns the offset in minutes from UTC time.  If you are in EDT, you'll get 240.  EST, 300.  PDT, 420. PST, 480.  etc....

If you want to test this out, disable any automatic setting of time or timezone, change the timezone on your device, close and relaunch your browser, then run the above code in the console.

In most cases, you don't have to really care what timezone a user is in when using moment.  However, if desired you could have a user profile setting for the timezone that you could use to override the device's inferred timezone.

#### How do you display times in correct local timezone for any user?

Assuming you have a property `createdAt` as specified above, you can display the date in the correct format for any user in any timezone quite easily with a helper method.

```
UI.registerHelper("localizedDateAndTime", function(date) {
	if(date)
		return moment(date).format('l LT'); // "5/23/2014 3:47 PM"
});
```

You can then use this helper method in your template
```
{{#each things}}
   Created At: {{localizedDateAndTime createdAt}}
{{/each}}
```

#### What about textual relative time display?

The following helpers return a less formal representation of a date that is relative to the current time.

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
