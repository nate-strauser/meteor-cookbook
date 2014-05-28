var Points = new Meteor.Collection(null);
var Observe; //placeholder for observe, needed to stop it on template destruction

if(Points.find({}).count() === 0){
	for(i = 0; i < 50; i++)
		Points.insert({
			x:Math.floor(Math.random() * 1000),
			y:Math.floor(Math.random() * 1000)
		});
}

Template.scatterPlotObserve.events({
	'click #add':function(){
		Points.insert({
			x:Math.floor(Math.random() * 1000),
			y:Math.floor(Math.random() * 1000)
		});
	},
	'click #remove':function(){
		var toRemove = Random.choice(Points.find().fetch());
		Points.remove({_id:toRemove._id});
	},
	'click #randomize':function(){
		//loop through bars
		Points.find({}).forEach(function(bar){
			//update the value of the bar
			Points.update({_id:bar._id},{$set:{
				x:Math.floor(Math.random() * 1000),
				y:Math.floor(Math.random() * 1000)
			}});
		});
	}
});


Template.scatterPlotObserve.destroyed = function(){
	if(Observe)
		Observe.stop(); //stop the query when the template is destroyed
};

Template.scatterPlotObserve.rendered = function(){
	//Width and height
	var w = 500;
	var h = 300;
	var padding = 30;
	
	//Create scale functions
	var xScale = d3.scale.linear()
					.range([padding, w - padding * 2]);

	var yScale = d3.scale.linear()
					.range([h - padding, padding]);

	//Define X axis
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.ticks(5);

	//Define Y axis
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.ticks(5);

	//Create SVG element
	var svg = d3.select("#scatterPlotObserve")
				.attr("width", w)
				.attr("height", h);

	//Create X axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (h - padding) + ")");
	
	//Create Y axis
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + padding + ",0)");

	//declare a transistion function to animate position and scale changes
	var transition = function(){
		var maxY = _.first(Points.find({},{fields:{y:1},sort:{y:-1},limit:1}).fetch());
		var maxX = _.first(Points.find({},{fields:{x:1},sort:{x:-1},limit:1}).fetch());
		
		//Update scale domains
		xScale.domain([0, maxX.x]);
		yScale.domain([0, maxY.y]);

		//Update X axis
		svg.select(".x.axis")
			.transition()
			.duration(1000)
			.call(xAxis);
		
		//Update Y axis
		svg.select(".y.axis")
			.transition()
			.duration(1000)
			.call(yAxis);

		svg
			.selectAll("circle")
			.transition()
			.duration(1000)
			.attr("cx", function(d) {
				return xScale(d.x);
			})
			.attr("cy", function(d) {
				return yScale(d.y);
			});
	};

	//transistion once right away to set the axis scale
	transition();

	//decalare a debounced version, only runs once per batch of calls, 50ms after last call - if a bunch of update occur at the same time, when only want to transisition once
	var lazyTransition = _.debounce(transition, 50);

	Observe = Points.find({},{fields:{x:1,y:1}}).observe({
		added: function (document) {
			svg
				.append("circle")
				.datum(document)//attach data
				.attr("cx", function(d) { //set the points right away, even if scale is wrong
					return xScale(d.x);
				})
				.attr("cy", function(d) {
					return yScale(d.y);
				})
				.attr("r", 2)
				.attr("id", "point-"+document._id);//set an id - FYI d3 does not like ids that start with digits
			lazyTransition();//transition
		},
		changed: function (newDocument, oldDocument) {
			svg
				.select("#point-"+newDocument._id)
				.datum(newDocument);//update data
			lazyTransition();//transition
		},
		removed: function (oldDocument) {
			svg
				.select("#point-"+oldDocument._id)
				.remove();//remove element
			lazyTransition();//transition
		}
	});
};