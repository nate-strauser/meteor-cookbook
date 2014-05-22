var Bars = new Meteor.Collection(null);

if(Bars.find({}).count() === 0){
	for(i = 0; i < 20; i++)
		Bars.insert({
			value:Math.floor(Math.random() * 25)
		})
}

Template.animatedBarChart.events({
	'click input':function(){
		//loop through bars
		Bars.find({}).forEach(function(bar){
			//update the value of the bar
			Bars.update({_id:bar._id},{$set:{value:Math.floor(Math.random() * 25)}});
		});
	}
});

Template.animatedBarChart.rendered = function(){
	//Width and height
	var w = 600;
	var h = 250;

	var dataset = _.pluck(Bars.find({}).fetch(), "value");

	var xScale = d3.scale.ordinal()
					.domain(d3.range(dataset.length))
					.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
					.domain([0, d3.max(dataset)])
					.range([0, h]);

	//Create SVG element
	var svg = d3.select("#animatedBarChart")
				.attr("width", w)
				.attr("height", h);

	//Create bars
	svg.selectAll("rect")
	   .data(dataset)
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	   		return xScale(i);
	   })
	   .attr("y", function(d) {
	   		return h - yScale(d);
	   })
	   .attr("width", xScale.rangeBand())
	   .attr("height", function(d) {
	   		return yScale(d);
	   })
	   .attr("fill", function(d) {
			return "rgb(0, 0, " + (d * 10) + ")";
	   });

	//Create labels
	svg.selectAll("text")
	   .data(dataset)
	   .enter()
	   .append("text")
	   .text(function(d) {
	   		return d;
	   })
	   .attr("text-anchor", "middle")
	   .attr("x", function(d, i) {
	   		return xScale(i) + xScale.rangeBand() / 2;
	   })
	   .attr("y", function(d) {
	   		return h - yScale(d) + 14;
	   })
	   .attr("font-family", "sans-serif")
	   .attr("font-size", "11px")
	   .attr("fill", "white");


   //declare a deps autorun to update the graph whenever the data changes
   Deps.autorun(function(){
   		var dataset = _.pluck(Bars.find({},{fields:{value:1}}).fetch(), "value");
   		//Update all rects
		svg.selectAll("rect")
		   .data(dataset)
		   .transition()
		   .delay(function(d, i) {
			   return i / dataset.length * 1000;
		   })
		   .duration(500)
		   .attr("y", function(d) {
		   		return h - yScale(d);
		   })
		   .attr("height", function(d) {
		   		return yScale(d);
		   })
		   .attr("fill", function(d) {
				return "rgb(0, 0, " + (d * 10) + ")";
		   });

		//Update all labels
		svg.selectAll("text")
		   .data(dataset)
		   .transition()
		   .delay(function(d, i) {
			   return i / dataset.length * 1000;
		   })
		   .duration(500)
		   .text(function(d) {
		   		return d;
		   })
		   .attr("x", function(d, i) {
		   		return xScale(i) + xScale.rangeBand() / 2;
		   })
		   .attr("y", function(d) {
		   		return h - yScale(d) + 14;
		   });
   });
};