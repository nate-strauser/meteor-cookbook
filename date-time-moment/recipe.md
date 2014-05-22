# Document Dates

[Live Demo](http://date-time-moment.meteor.com/) - [Demo Source](date-example/)

---------

* [Introduction to Dates](#introduction-to-dates)
* [Storing Dates](#storing-dates)
* [Trusting Generated Dates](#trusting-generated-dates)
* [Automatic Document Timestamping](#automatic-document-timestamping)
* [Formatting Dates For Display](#formatting-dates-for-display)

---------

## Introduction to Dates

Dates in JavaScript are a bit of a mess.  They are tricky to work with and somewhat difficult to understand, but completely necessary to all but the most simplistic applications.  In this article, we will discuss most common usages of dates within Meteor applications, including storage, trusted generation, automatic timestamping, and formatting dates for display.

----


JavaScript has a object type, `Date`, which represents a particular date and time, accurate to within a millisecond.

> [Mozilla Javascript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
> 
> The JavaScript date is  based on a time value that is milliseconds since midnight 01 January, 1970 UTC. A day holds 86,400,000 milliseconds. The JavaScript Date object range is -100,000,000 days to 100,000,000 days relative to 01 January, 1970 UTC.

We also have support for `Date` objects throughout Meteor applications via [EJSON](http://docs.meteor.com/#ejson) and also in the [MongoDB database](http://docs.mongodb.org/manual/reference/bson-types/#date).


In any JavaScript console, you can create a new date and inspect some of its properties.

```
var date = new Date();  //create a new date that represents the current date and time
date.toString(); // -> "Thu May 22 2014 16:47:19 GMT-0400 (EDT)"
date.toJSON();   // -> "2014-05-22T20:47:19.039Z"
date.valueOf();  // -> "1400791639039"

```

If you wanted to create a date object from a known and specific date and/or time, you can do that via the constructor parameters.

```
var startOf2014 = new Date(2014,1,1);
```
See the [Mozilla docs on Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) for more examples.


The `Date` object type is mostly a wrapper around a numerical value, which is a [Unix Offset](http://en.wikipedia.org/wiki/Unix_time).  This wrapper provides additional functionality, like getting and setting the hour or month of the date, that is useful and that would be difficult to accomplish by manually interacting with the offset itself.


## Storing Dates

The best way to represent dates on your collection documents is by directly using the date object type.  A date that represents the current date and time can be generated via a call to the `new Date()` constructor.  Meteor applications have full stack support for using `Date` objects.  The client and server runtimes are JavaScript, which natively supports `Date` objects.  The [EJSON](http://docs.meteor.com/#ejson) extension to JSON in Meteor core provides support for Date objects throughout your application code.  MongoDB also has support for Date objects.  Since we have proper support for `Date` objects throughout the entire stack, it makes sense to use these objects.

```
var date = new Date();
// date -> Wed May 14 2014 14:03:28 GMT-0700 (UTC)
```

We can also generate a date object as one of the properties sent to the collection's `insert` method.

```
Things.insert({
  name:'My New Thing',
  createdAt: new Date()
});
```

Dates objects can also easily be used in a collection query.

```
var startDate = new Date(2014,1,1);
var endDate = new Date(2015,1,1);
var results = Things.find({
  createdAt:{
     $lt:endDate,
     $gte:startDate
  }
});
```
This will give us all `Things` that were created during the year 2014.  See the [mongo cookbook](http://cookbook.mongodb.org/patterns/date_range/) for further examples.



It is also possible to store dates as a unix offset, see [alternative options](#alternative-options).



## Trusting Generated Dates

An troublesome issue when generating date objects is that dates are always constructed using the time and date of the operating system on which the generation occurs.  If your application generates dates directly on the client, then you are vulnerable to a user simply changing the date or time on their device.  Even if your users are not actively trying to provide you with an incorrect date, you must still account for incorrect times on devices.  **The date and time of any user controlled device can not be trusted, thus is it necessary to only utilize the date and time of your server.**

The best mechanism for ensuring accurate creation/insert dates on your documents is to use the [collection-hooks package](https://atmospherejs.com/package/collection-hooks)

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
    //add or overwrite the createdAt property for each insert
    doc.createdAt = new Date();
  });
}
```

Using collection-hooks provides the least intrusive option for ensuring date integrity on your documents.  However, care must be taken to ensure that the hook is executing in the correct location.  Without the `Meteor.isServer` wrapper or placing the code in the `server/` folder of your app, you could be still using the date from the client. 
This pattern also ensures that any inserted document, regardless of where the insert call originated, will use the server's clock for the `createdAt` property.

It is also possible to use Meteor methods or the collection2 package to accomplish the same goals, see [alternative options](#alternative-options).


## Automatic Document Timestamping

If you want your collection documents to have an automatically generated date upon insertion or update, the collection-hooks usage pattern above can be slightly extended to provide that feature.

```
// server/hooks.js or wrapped in if(Meteor.isServer){...}

// ensure createdAt date on insert
Things.before.insert(function(userId, doc){
	doc.createdAt = new Date();
});

// ensure updatedAt date on update
Things.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set.updatedAt = new Date();
});
```

Defining hooks like this for each of your collections will allow you to always have correct and reliable dates for your documents.  This approach is highly recommended as you can create these hooks once, then just rely on them being set and accurate throughout your application.



## Formatting Dates for Display

Javascript has very poor support for displaying dates in a user friendly manner, so we recommend using the [moment.js package](https://atmospherejs.com/package/moment) as it provides an easy to use interface for parsing, formatting and manipulating dates.

```
var formatted = moment(new Date()).format('l LT'); 
// 'l LT' is shorthand for localized format date and time
// formatted -> "5/23/2014 3:47 PM"
```

See the full list formatting options in the [moment docs](http://momentjs.com/docs/#/displaying/format/).

You can use a template helper to display any date in the correct format for any user and in their local time zone.

```
UI.registerHelper("localizedDateAndTime", function(date) {
	if(date)
		return moment(date).format('l LT'); // shorthand for localized format "5/23/2014 3:47 PM"
});
```

You can then use this helper method in your templates

```
{{#each things}}
   Created At: {{localizedDateAndTime createdAt}}
{{/each}}
```

Moment also provides other useful formatting options that are common in modern applications. These are less formal and easily readable representations of a date that is relative to the current time.

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

See the moment docs for [fromNow()](http://momentjs.com/docs/#/displaying/fromnow/) and [.calendar()](http://momentjs.com/docs/#/displaying/calendar-time/) for additional options and details.



#### Time zones


Moment automatically detects what time zone the client device is set to, as well as whether or not daylight savings time is in effect. If you just want all times to be displayed in the local time zone of each client, you can just use moment to format the date as shown above.  **No special handling is needed as formatting into the device's timezone is the default behavior.**

##### Formatting into a specific timezone

To override the default behavior of using the device's timezone, we must also use the [moment-timezone package](https://atmospherejs.com/package/moment-timezone).  With moment timezone, we can transform a moment object to any given timezone.

```
var date = new Date(); //create new date object

var ny_local = moment(date).tz("America/New_York").format('l LT');
// ny_local -> "5/22/2014 4:30 PM"

var la_local = moment(date).tz("America/Los_Angeles").format('l LT');
// la_local -> "5/22/2014 1:30 PM"

```

This is useful if you want a date to display in a certain timezone.  A common use case is that a user picks their timezone in a settings area, then that timezone setting is used to format all application times.

## Alternative Options

The previously mentioned options are the recommended implementation for all meteor applications.  However, the following options are technically valid and could be useful or desired in certain applications.

> #### Date Storage Alternatives
> 
> ##### Unix Offset
> It is fairly common for developers to store just the numerical representation of a Date object, the unix offset
> 
> ```
> var date = Date.now();
> // date -> 1400101308998
> ```
> Its quite possible to directly use the unix offset, storing just a simple integer, instead of the a date object, but it does not appear to provide any significant advantage over a date object.  However, a date object does have several clear advantages over an offset, thus a date object is the recommended approach.

--------------

> #### Date Generation Alternatives
> ##### [Meteor Methods](http://docs.meteor.com/#methods_header)
>  
> ```
>  var Things = new Collection('things');
>  if (Meteor.isClient) {
>   Template.thing.events({
>     'click #createNewThing': function () {
>       var thingProps = {
>         name:'My New Thing'
>       };
> 
>       Meteor.call('createNewThing', thingProps, function(error, result){
>         var thingId = result;
>       });
>     }
>   });
> }
> 
> if (Meteor.isServer) {
>   Meteor.startup(function () {
>     Meteor.methods({
>       createNewThing: function (props) {
>         props.createdAt = new Date();
>         return Things.insert(props);
>       }
>     });
>   });
>  }
>  ```
> 
> This will ensure that the property `createdAt` is set on the server (using server time), right before insertion.  Any inserts that do not use this method, may not have the correct date or even have the date at all.  Methods can be used to meet date integrity needs, however special care must be taken to not circumvent your own methods.  Methods also have special properties in comparison to non-method code and thus should be reserved for advanced use cases rather than using methods as simple wrappers for insert/update/remove operations.
> 
> 
> 
> ##### [collection2 package](https://github.com/aldeed/meteor-collection2#autovalue)
> ```
> Things = new Meteor.Collection("things", {
>     schema: new SimpleSchema({
>         name:{
>         	type:String
>     	},
>     	
>     	//
>     	// ... other schema properties ...
>     	//
> 
>         // Force value to be current date (on server) upon insert
>         // and prevent updates thereafter.
>         createdAt: {
>             type: Date,
>             autoValue: function() {
>                 if (this.isInsert) {
>                     return new Date();
>                 } else if (this.isUpsert) {
>                     return {$setOnInsert: new Date()};
>                 } else {
>                     this.unset();
>                 }
>             },
>             denyUpdate: true
>         },
>         // Force value to be current date (on server) upon update
>         // and don't allow it to be set upon insert.
>         updatedAt: {
>             type: Date,
>             autoValue: function() {
>                 if (this.isUpdate) {
>                     return new Date();
>                 }
>             },
>             denyInsert: true,
>             optional: true
>         }
>     })
> });
> 
> if (Meteor.isClient) {
>   Template.thing.events({
>     'click #createNewThing': function () {
>       var thingId = Things.insert({
>         name:'My New Thing'
>       });
>     }
>   });
> }
> ```
> In this pattern we do the insert right from the client side, which simplifies our code a good bit compared to using methods.  From the collection2 docs we can learn that even though the autovalue is defined and executed on both client and server, 'the actual value saved will always be generated on the server'.  We also have the added benefit here of always having a correct createdAt and updatedAt date for this any object in this collection.  Collection2 is very powerful and especially useful in conjunction with the autoform package.  However, the up front effor of defining a data schema is not always desirable.  It is possible to use both collection-hooks and collection2 on the same collection, if desired.



## TODO
* performance test of date vs offset with graphs
* moment helpers package