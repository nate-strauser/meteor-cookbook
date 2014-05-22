# Dates and Times

[Demo](http://date-time-moment.meteor.com/) - [Source](date-example/)

---------

Dates in javascript 

what really is a date


From the [Mozilla Javascript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
>
> The JavaScript date is  based on a time value that is milliseconds since midnight 01 January, 1970 UTC. A day holds 86,400,000 milliseconds. The JavaScript Date object range is -100,000,000 days to 100,000,000 days relative to 01 January, 1970 UTC.

Mongo uses the same representation
http://docs.mongodb.org/manual/reference/bson-types/#date
> Date is a 64-bit integer that represents the number of milliseconds since the Unix epoch (Jan 1, 1970). This results in a representable date range of about 290 million years into the past and future.

if we query mongo, we can see:
```
//db.things.find({}).pretty()
...
{
  "name" : "My Thing #15",
  "_id" : "tuXhLeskHvKvaaeT6",
  "createdAt" : ISODate("2014-05-14T22:39:38.519Z")
}
...
```

EJSON will translate the date to it
```
EJSON.stringify(new Date())
"{"$date":1400779059471}"
```
when parsed it gets turned back into a date object

EJSON has support for native date objects
http://docs.meteor.com/#ejson

Regardless of the underlying reprenestion used by mongo and ejson, both will always provide the typical date operations and methods - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date


if we create a new date we can inspect the properties of is
```
var date = new Date();

console.log(date); //calls .toString 

Date object
```
This means that the Date object type is simply a wrapper around a numerical value, which is a [Unix Offset](http://en.wikipedia.org/wiki/Unix_time).  This wrapper provides additional functionality, like getting and setting the hour or month of the date, that is useful and that would be difficult to accomplish by manually interacting with the offset itself.


if you wanted to create a date object from a known and specific date and/or time, you can easily do that via the constructor options
```
var startOf2014 = new Date(2014,1,1);
```
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date for more examples

how is thi


native js support for dates is limited and difficult to use



Dates and times are vital to almost all applications and can be quite tricky to properly utilize.  Fortunately, by using Moment and some other packages you can make it quite simple for your meteor applications.




----------


## Table of Contents

* [Storing Dates](#storing-dates)
* [Trusting Generated Dates](#trusting-generated-dates)
* [Automatic Document Timestamping](#automatic-document-timestamping)
* [Formatting Dates For Display](#formatting-dates-for-display)



## Storing Dates

The easiest and best way to represent dates and times on your collection documents is by directly using the Date object type.  This object can be generated as follows
```
var date = new Date();
// date -> Wed May 14 2014 14:03:28 GMT-0700 (UTC)
```

You would attach this to an object when inserting like so
```
Things.insert({
  name:'My New Thing',
  createdAt: new Date()
});
```

Dates can easily be used in a query.  See the mongo cookbook - http://cookbook.mongodb.org/patterns/date_range/ For this example we are looking 
```
var startDate = new Date(2014,1,1);
var endDate = new Date(2015,1,1);
var result = Things.find({createdAt:{$lt:endDate,$gte:startDate}});
```


##### What about storing as an offset?
It is fairly common for developers to store just the numerical representation of a Date object, the unix offset
```
var date = Date.now();
// date -> 1400101308998
```
An offset meets criteria #1 as it is a number of milliseconds since epoch (1 January 1970 00:00:00 UTC), from which you can calculate date, time, and adjust for timezone. A timestamp is very similar expect that it is seconds since epoch, rather than milliseconds.
Its quite possible to directly use the unix offset instead of the a date object, but it does not appear to provide any signignifcant adavantage over a date object.  However a date object does have several clear advantages over an offset, thus a date object is the recommended approach.











### Trusting Generated Dates?

The problem with generating date object is that dates are always constructed using the time and date of the operating system on which the generation occurs.  If your application generates dates directly from the client, then you are vulnerable to a user simply changing the date or time on their device.  Even if your users are not actively trying to provide you with an incorrect date, you must still account for incorrect times on devices.  Essentially, the date and time of any user controlled device can not be trusted, thus is it necessary to only utilize the date and time of your server.

The easiest mechanism for ensuring accurate dates is to use the collection-hooks package

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
This pattern ensures our objects have the correct date without having to defining a schema like with collection2.  Care must be taken to ensure that the hook is executing in the correct location. Without the `Meteor.isServer` wrapper or placing the code in the `server/` folder of your app, you could be using the date from the client.  This option also provides that any insert or update will have the correct server time appended to the operation.


#### Alternative Options

You can also use methods or the collection2 package to ensure that you documents have trusted dates.

 ##### [Methods](http://docs.meteor.com/#methods_header)
 
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



##### [collection2](https://github.com/aldeed/meteor-collection2#autovalue)
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

Moment can automatically detect what time zone your device is set to, as well as whether or not daylight savings time is in effect. Try it out in the dev console when browsing momentjs.com
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
		return moment(date).format('l LT'); // shorthand for localized format "5/23/2014 3:47 PM"
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


### TODO
* performance test of date vs offset with graphs
* moment helpers package
* does offset have issue with year 2038? http://en.wikipedia.org/wiki/Unix_time#Notable_events_in_Unix_time
