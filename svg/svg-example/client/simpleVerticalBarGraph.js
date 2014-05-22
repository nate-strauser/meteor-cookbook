var BarPoints = new Meteor.Collection(null);

var createBarGraphData = function(){
	for(i = 0; i < 5; i++){
		var value = Math.floor(Math.random()*300);
		BarPoints.insert({
			value:value,
			bar:i*80,
			text:value-3
		});
	}
};
createBarGraphData();

Template.simpleVerticalBarGraph.events({
	'click input': function () {
		BarPoints.find({}).forEach(function(point){
			var value = Math.floor(Math.random()*300);
			BarPoints.update({_id:point._id},{$set:{
				value:value,
				text:value-3
			}})
		});
	}
});

Template.simpleVerticalBarGraph.helpers({
	'points': function () {
		return BarPoints.find({});
	}
});