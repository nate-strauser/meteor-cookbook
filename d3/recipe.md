# D3 Visualizations

[Demo](http://reactive-d3.meteor.com/) - [Source](d3-example/)

----------

D3 examples
https://github.com/mbostock/d3/wiki/Gallery
http://bl.ocks.org/mbostock

Excellent very indepth tutioral on D3 - http://chimera.labs.oreilly.com/books/1230000000345/index.html


non-reactive examples
http://bl.ocks.org/mbostock/3887235
http://bl.ocks.org/mbostock/7441121



important points
*bind to data with key function, then order of results doesnt change wihtout yr sorting
*sorting via mongo query
*everything should be triggered via data changes
*binding events - d3 style and meteor style - does the meteor style even work if d3 added the node?
*dont call axises to display them right away - initial scaling looks odd

todo
add example with observe, might be more performant, surely more complex - non-standard d3 style code
add time series example - http://bl.ocks.org/mbostock/3883245 - canned data plus btc ticker https://www.bitstamp.net/api/ticker/ - fetch data every 10 seconds - https://coinbase.com/api/doc/1.0/prices/historical.html - https://coinbase.com/api/doc/1.0/prices/spot_rate.html
add some automatic changes via intervals



With the introduction of Blaze in Meteor 0.8.0 we now have native SVG rendering support; which gives Meteor applications the ability to easily construct reactive and data driven graphs and charts.  This can be done without [D3](http://www.d3js.org) (Data Driven Documents) at all.  If desired, D3 can be used just for interactivity or to construct the SVG components and process data updates, all while maintaining reactivity.

If you are not familiar with SVG (Scalable Vector Graphics), take a look at this [wikipedia article](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics).  Essentially, SVG is a XML based format for defining a two dimensional image via components (lines, circles, etc) that can be scaled without degredation and rendered in all modern web browsers.  Its a image/graphic that can be rendered directly from XML code, rather than a binary format like PNG, JPG, etc.

If you new to D3, it is essentially a javascript library for manipulating documents based on data.  These manipulations are accomplised via HTML, SVG, and CSS. Also, be sure to check out some of the [examples](https://github.com/mbostock/d3/wiki/Gallery) to see for yourself the full range of visualizations that D3 can produce.


----------


Useful for producing the most advanced and beautiful charts that D3 is capable of generating.  These advanced charts can easily have animation for data changes and interactivity.  Blaze is not very involved in the actual rendering of the chart as D3 handles the SVG manipulation and creation.  However, Meteor is still involved as it manages the backing data and orchestrates the rendering calls.

#### Animated Donut Chart

Lets take one of the many D3 examples and alter it so that it is backed by data from a Meteor collection and that it reactively updates as data changes are made.  This  [donut chart example](http://bl.ocks.org/dbuezas/9306799) has some nice animation code that we can build on.

```
<svg id="animatedDonutChart" width="800" height="600">
</svg>    
```
The template code is very minimal.  We are just creating the container for D3 to utilize.  Since we are not looping over data and creating elements, you can see how the rendering engine, Blaze, has very limited involvement here.


```
Template.animatedDonutChart.rendered = function(){
	//set up our d3 object
	svg = d3.select("#animatedDonutChart")
		.append("g")

	svg.append("g")
		.attr("class", "slices");
	svg.append("g")
		.attr("class", "labels");
	svg.append("g")
		.attr("class", "lines");

	pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	arc = d3.svg.arc()
		.outerRadius(radius * 0.8)
		.innerRadius(radius * 0.4);

	outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);

	//set up a deps autorun to listen for data updates, redrawing graph as needed
	Deps.autorun(function(){
		updateChartData(
			Sections.find({},{fields:{
				label:1, //limiting fields in likely important in real world usage to reduce graph updates
				color:1,
				value:1
			}}).fetch()
		);
	});
};
```
Here we have our rendered callback that inits the D3 object for the initial rendering and subsequent updates.  Most of the D3 specific code is unchanged from the original, with some slight reworking to break it into the Meteor template structure.  The important part here is the `Deps.autorun`, with this we declare a reactive query `Sections.find(...)`.  We use the `fields` specifier to reduce redraws, turn the query cursor into an array with `fetch()`, and finally pass that array to the `updateChartData` function which sets or updates the actual SVG element via D3.  `Deps.autorun` is very powerful for easily reacting to data changes in collections, see http://docs.meteor.com/#deps_autorun for more details.

```
var updateChartData = function(data) {
	/* ------- PIE SLICES -------*/
	var slice = svg.select(".slices").selectAll("path.slice")
		.data(pie(data), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { 
			return d.data.color; //minor change here from original, color is part of object not a lookup on an ordinal scale
		})
		.attr("class", "slice");

	slice		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arc(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/

	var text = svg.select(".labels").selectAll("text")
		.data(pie(data), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.text(function(d) {
			return d.data.label;
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = svg.select(".lines").selectAll("polyline")
		.data(pie(data), key);
	
	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};			
		});
	
	polyline.exit()
		.remove();
};
```
Here we have our `updateChartData` function which has only been just barely changed to accommodate the color property being part of the object rather than an ordinal scale as it was in the original.  The function was named `change` in the original D3 example.

```
Template.animatedDonutChart.events({
	'click input':function(){
		//loop through sections
		Sections.find({}).forEach(function(section){
			//update the value of the section
			Sections.update({_id:section._id},{$set:{value:Math.random()}});
		});
	}
});
```

Here is the event handler code attached to the 'Randomize Values' button.  It simply assigns a new random value to each section object.  Since we've used `Deps.autorun`, we already have reactivity in place, we simply update the underlying data and the graph automatically updates. 


### TODO
add images of charts, graphs   
custom icon with number example    
could add hyperlinks from index to header of expanded concept    
add deps.autorun setup/teardown
add simple spark line example
** could we fork d3 to be a component? let blaze do the rendering?
line chart example could use real data - like https://coinbase.com/api/doc/1.0/prices/historical.html
example done with observe