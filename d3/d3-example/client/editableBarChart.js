var Bars = new Meteor.Collection(null);

if(Bars.find({}).count() === 0){
	for(i = 0; i < 10; i++)
		Bars.insert({
			value:Math.floor(Math.random() * 25)
		})
}

Template.editableBarChart.events({
	'click #add':function(){
		Bars.insert({
			value:Math.floor(Math.random() * 25)
		});
	},
	'click #remove':function(){
		var toRemove = Random.choice(Bars.find().fetch());
		Bars.remove({_id:toRemove._id});
	}
});


Template.editableBarChart.rendered = function(){
	

	//Width and height
	var w = 600;
	var h = 250;
	
	var dataset = Bars.find({},{fields:{value:1}}).fetch();
	
	var xScale = d3.scale.ordinal()
					.domain(d3.range(dataset.length))
					.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
					.domain([0, d3.max(dataset, function(d) { return d.value; })])
					.range([0, h]);
	
	//Define key function, to be used when binding data
	var key = function(d) {
		return d._id;
	};
	
	//Create SVG element
	var svg = d3.select("#editableBarChart")
				.attr("width", w)
				.attr("height", h);

	//Create bars
	svg.selectAll("rect")
	   .data(dataset, key)
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	   		return xScale(i);
	   })
	   .attr("y", function(d) {
	   		return h - yScale(d.value);
	   })
	   .attr("width", xScale.rangeBand())
	   .attr("height", function(d) {
	   		return yScale(d.value);
	   })
	   .attr("fill", function(d) {
			return "rgb(0, 0, " + (d.value * 10) + ")";
	   });

	//Create labels
	svg.selectAll("text")
	   .data(dataset, key)
	   .enter()
	   .append("text")
	   .text(function(d) {
	   		return d.value;
	   })
	   .attr("text-anchor", "middle")
	   .attr("x", function(d, i) {
	   		return xScale(i) + xScale.rangeBand() / 2;
	   })
	   .attr("y", function(d) {
	   		return h - yScale(d.value) + 14;
	   })
	   .attr("font-family", "sans-serif")
	   .attr("font-size", "11px")
	   .attr("fill", "white");



	Deps.autorun(function(){
		var dataset = Bars.find({},{fields:{value:1}}).fetch();

		//Update scale domains
		xScale.domain(d3.range(dataset.length));
		yScale.domain([0, d3.max(dataset, function(d) { return d.value; })]);

		//Select…
		var bars = svg.selectAll("rect")
			.data(dataset, key);
		
		//Enter…
		bars.enter()
			.append("rect")
			.attr("x", w)
			.attr("y", function(d) {
				return h - yScale(d.value);
			})
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) {
				return yScale(d.value);
			})
			.attr("fill", function(d) {
				return "rgb(0, 0, " + (d.value * 10) + ")";
			});

		//Update…
		bars.transition()
			.duration(500)
			.attr("x", function(d, i) {
				return xScale(i);
			})
			.attr("y", function(d) {
				return h - yScale(d.value);
			})
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) {
				return yScale(d.value);
			});

		//Exit…
		bars.exit()
			.transition()
			.duration(500)
			.attr("x", -xScale.rangeBand())
			.remove();



		//Update all labels

		//Select…
		var labels = svg.selectAll("text")
			.data(dataset, key);
		
		//Enter…
		labels.enter()
			.append("text")
			.text(function(d) {
				return d.value;
			})
			.attr("text-anchor", "middle")
			.attr("x", w)
			.attr("y", function(d) {
				return h - yScale(d.value) + 14;
			})						
		   .attr("font-family", "sans-serif")
		   .attr("font-size", "11px")
		   .attr("fill", "white");

		//Update…
		labels.transition()
			.duration(500)
			.attr("x", function(d, i) {
				return xScale(i) + xScale.rangeBand() / 2;
			});

		//Exit…
		labels.exit()
			.transition()
			.duration(500)
			.attr("x", -xScale.rangeBand())
			.remove();

	});
};