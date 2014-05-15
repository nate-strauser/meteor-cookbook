var ScatterPoints = new Meteor.Collection(null);

var createScatterPlotData = function(){
  for(i = 0; i < 20; i++){
    ScatterPoints.insert({
      x:Math.floor(Math.random()*300),
      y:Math.floor(Math.random()*400)
    });
  }
};
createScatterPlotData();

Template.simpleScatterPlot.events({
  'click input': function () {
    ScatterPoints.find({}).forEach(function(point){
      ScatterPoints.update({_id:point._id},{$set:{
        x:Math.floor(Math.random()*300),
        y:Math.floor(Math.random()*400)
      }})
    });
  }
});

Template.simpleScatterPlot.helpers({
  'points': function () {
    return ScatterPoints.find({});
  }
});