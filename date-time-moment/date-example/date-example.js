Things = new Meteor.Collection("things");

if (Meteor.isClient) {
  Session.set('clientDate', new Date());
  Meteor.call('getServerDate', function(error, result){
        if(error)
          console.log(error);
        else
          Session.set('serverDate', result);
  });

  Template.thing.helpers({
    'things':function(){
      return Things.find({},{sort:{createdAt:-1},limit:10});
    },
    'clientDate':function(){
      return Session.get('clientDate');
    },
    'serverDate':function(){
      return Session.get('serverDate');
    }
  });

  
  Template.thing.events({
    'click #createNewThing': function () {
      var thingId = Things.insert({
        name:'My Thing #'+(Things.find({}).count()+1)
      });
    }
  });

  UI.registerHelper("localizedDateAndTime", function(date) {
    if(date)
      return moment(date).format('l LT'); // shorthand for localized format "5/23/2014 3:47 PM"
  });
}

if (Meteor.isServer) {
  Things.before.insert(function(userId, doc){
    doc.createdAt = new Date();
  });
  Things.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set.updatedAt = new Date();
  });

  Meteor.startup(function () {
    Meteor.methods({
      getServerDate: function () {
        return new Date();
      }
    });
  });
}
