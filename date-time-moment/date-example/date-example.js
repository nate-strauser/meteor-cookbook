if (Meteor.isClient) {
  Template.dates.helpers({
    'dateIsSet':function(){
      return Session.equals("serverDate", undefined);
    },
    'date':function () {
      return Session.get('serverDate').toString();
    }
  });

  
  Template.dates.events({
    'click #fetchServerDate': function () {
      Meteor.call('getServerDate', function(error, result){
        Session.set('serverDate', result);
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.methods({
      getServerDate: function () {
        return new Date();
      }
    });
  });
}
