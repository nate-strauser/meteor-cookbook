var Points = new Meteor.Collection(null);

if(Points.find({}).count() === 0){
	for(i = 0; i < 50; i++)
		Points.insert({
			x:Math.floor(Math.random() * 1000),
			y:Math.floor(Math.random() * 1000)
		});
}

Template.scatterPlot.events({
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

Template.scatterPlot.rendered = function(){
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
	var svg = d3.select("#scatterPlot")
				.attr("width", w)
				.attr("height", h);

	//Define key function, to be used when binding data
	var key = function(d) {
		return d._id;
	};

	//Create X axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (h - padding) + ")");
	
	//Create Y axis
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + padding + ",0)");

	Deps.autorun(function(){
		var dataset = Points.find({},{fields:{x:1,y:1}}).fetch();
		
		//Update scale domains
		xScale.domain([0, d3.max(dataset, function(d) { return d.x; })]);
		yScale.domain([0, d3.max(dataset, function(d) { return d.y; })]);

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
		

		var circles = svg
			.selectAll("circle")
			.data(dataset, key);

		//Create
		circles
			.enter()
			.append("circle")
			.attr("cx", function(d) {
				return xScale(d.x);
			})
			.attr("cy", function(d) {
				return yScale(d.y);
			})
			.attr("r", 2);

		//Update
		circles
			.transition()
			.duration(1000)
			.attr("cx", function(d) {
				return xScale(d.x);
			})
			.attr("cy", function(d) {
				return yScale(d.y);
			});

		//Remove
		circles
			.exit()
			.remove();
	});
};