# Reactive and Interactive SVGs, optionally using D3

[Demo](http://reactive-svg-d3.meteor.com/) - [Source](svg-example/)

----------

With the introduction Blaze in Meteor 0.8.0 we now have native SVG rendering support, which gives Meteor applications that ability to easily construct reactive and data driven graphs and charts.  This can be done without D3 at all.  If desired, D3 can be used just for interactivity or to construct the SVG components and process data updates, all while maintaining reactivity.

----------

## Integration levels with SVG and D3
1. Meteor renders and updates SVG directly, no D3
2. Meteor renders and updates SVG directly, D3 is used for interactivity
3. D3 renders and updates SVG, Meteor orchestrates D3 execution and updates


### Integration Level #1

Useful for the most simple of data backed SVG images. Directly crafting a raw SVG is not trivial for anything beyond very simple graphs or drawings.  Simplistic bar graphs and scatter plots are quite doable.  Going beyond these basic data representations into more complex ones is best suited for a library like D3.

#### Simple Scatter Plot
```
<svg class="chart" width="400" height="300">
	{{#each points}}
		<circle cx="{{x}}" cy="{{y}}" r="5"/>
	{{/each}}
</svg>
```
This markup is quite simple, just a basic SVG element with a circle element declared for each point.

```
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
```
Our controller code here is rather simple also.  For the data we are just returning all of the points.  To regenerate the graph, we simply set new X/Y coordinates for each point.  Since the SVG is reactive, the graph updates on its own whenever the underlying data changes.

#### Simple Vertical Bar Graph
```
<svg class="chart" width="400" height="300">
	<g transform="rotate(-90) translate(-300, 0)">
		{{#each points}}
			<g transform="translate(0,{{bar}})">
				<rect width="{{value}}" height="75"></rect>
				<text x="{{text}}" y="9.5" dy=".35em">{{value}}</text>
			</g>
		{{/each}}
	</g>
</svg>
```
This markup is a little more complicated in that we are using the transform directives to properly position our elements.  Positioning the text element here is not trivial, it must be precisely positioned using the attributes of the rectangle element.  The complexity to render such a simple graph makes it clear that a library like D3 is rather useful for anything but the most simple data representations.

```
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
```
Like the scatter plot, this controller code is quite simple.  Since the SVG is reactive, we just update the underlying data and the graph redraws.

### Integration Level #2

Useful for leveraging the Blaze rendering engine for data driven updates while layering on D3 to provide interactivity.  We still have to manually control the display and thus complex graphs are difficult, but not impossible. 

#### Draggable Nodes

Here we have a simplistic SVG element that consists of a set of node drawn as circles and a set of connectors drawn as lines that link nodes to one another.

```
<svg id="dragableGraph" width="800" height="600">
    {{#each connectors}}
        {{>draggableGraphConnector}}
    {{/each}}
    {{#each nodes}}
        {{>draggableGraphNode}}
    {{/each}}
</svg>
```
This is our base for the graph.  Its fairly minimal, just looping over 2 sets of objects, including sub-templates for rendering the connectors and nodes.


```
<template name="draggableGraphNode">
    <circle id="node_{{_id}}" cx="{{x}}" cy="{{y}}" class="node" data-id="{{_id}}" r="10"/>
</template>

<template name="draggableGraphConnector">
    <line id="connector_{{_id}}" class="connector" data-id="{{_id}}" x1="{{sourceX}}" y1="{{sourceY}}" x2="{{targetX}}" y2="{{targetY}}" />
</template>
```

Here we have our sub-templates used for each node and connector.  The node properties are read directly from the object itself, while the source and target X/Y coordinates are pulled from helpers for the connectors.

```
//helpers for connectors are reactive, so any changes to nodes redraws connectors also
Template.draggableGraphConnector.helpers({
    "sourceX":function(){
        var node = Nodes.findOne({_id:this.sourceId});
        if(node){
            return node.x;
        }
    },
    "sourceY":function(){
        var node = Nodes.findOne({_id:this.sourceId});
        if(node){
            return node.y;
        }
    },
    "targetX":function(){
        var node = Nodes.findOne({_id:this.targetId});
        if(node){
            return node.x;
        }
    },
    "targetY":function(){
        var node = Nodes.findOne({_id:this.targetId});
        if(node){
            return node.y;
        }
    }
});
```
These helpers look up the source or target node and provide the X or Y coordinate of that object.  This code is fairly simple as our nodes are circles, thus we can point to the X/Y coordinate of the node as the coordinates are the center of the shape.  If we used rectangles we would have to do some additional calculations as rectangle coordinates are the bottom left of the shape.


```
var nodeDrag = d3.behavior.drag().on("drag", function(d) {
    var id = $(this).data("id");
    if(id && d3.event.dx !== 0 || d3.event.dy !== 0){
        var incObject = {};
        if(d3.event.dx !== 0)//did it move in x direction?
            incObject.x = d3.event.dx;

        if(d3.event.dy !== 0)//did it move in y direction?
            incObject.y = d3.event.dy;

        if(incObject.x || incObject.y)//if moved x or y
            Nodes.update({_id:id},{$inc:incObject});//use increment to save the delta of position, positive or negative
            //save the new position to the collection, triggering a dom update by blaze/meteor
    }
});

Template.draggableGraphNode.rendered = function ( ) {
    d3.select("#node_"+this.data._id).call(nodeDrag);
    //attach drag handler
};
```
This is the most interesting part of this example as it defines the boundary between Meteor and D3.  In the rendered callback, we are attaching the `nodeDrag` function to each node element.  The `nodeDrag` function enables drag and drop behavior on the node via the `drag()` call.  We then listen for the `drag` event to fire, detect any change in X or Y position, then update the node object with the new coordinates, which triggers Blaze to update of the SVG node element, corresponding the drag movement.  It's important to note that D3 does not actually move the element, if we comment out the `Nodes.update(...)` call in the drag handler, nothing in the graph will change.  The event still fires, but the elements position does not change.  D3 handles only the drag event, while Meteor handles all rendering.

It should be easy to imagine a use case of this pattern where the owner of a graph can drag an element, saving that update to the database, while another user is simply having the SVG update for them, showing the actions of the owner to all viewers.  This is trivial to construct, all you have to do is only attach the drag handler if the current user is the owner.  Anyone who is not the owner, just has a live updating SVG that does not use D3 at all.


### Integration Level #3

Useful for producing the most advanced and beautiful charts that D3 is capable of.  These charts can easily have animation for data changes and interactivity.  Blaze is not very involved in the actual rendering of the chart as D3 handles the SVG manipulation and creation.  However, Meteor is still involved as it manages the backing data and orchestrates the rendering calls.

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

Here is the event handler code attached to the 'Randomize Values' button.  It simply assigns a new random value to each section object.  Since we've used `Deps.autorun`, we already have reactivity in place, we simply just update the underlying data and the graph automatically updates. 


Let's take a look at the SVG code that D3 generates for this Donut Chart
```
<svg id="animatedDonutChart" width="800" height="600">
    <g transform="translate(400,300)">
    	<g class="slices">
    		<path class="slice" d="M0,-240A240,240 0 0,1 180.52756971579979,-158.14485945647075L90.26378485789989,-79.07242972823538A120,120 0 0,0 0,-120Z" style="fill: rgb(123, 104, 136);"></path>
    		<path class="slice" d="M180.52756971579979,-158.14485945647075A240,240 0 0,1 219.63842361725474,-96.74173282987643L109.81921180862737,-48.37086641493821A120,120 0 0,0 90.26378485789989,-79.07242972823538Z" style="fill: rgb(152, 171, 197);"></path>
    		<path class="slice" d="M219.63842361725474,-96.74173282987643A240,240 0 0,1 233.26035679830042,-56.476596447816505L116.63017839915021,-28.238298223908252A120,120 0 0,0 109.81921180862737,-48.37086641493821Z" style="fill: rgb(160, 93, 86);"></path>
    		<path class="slice" d="M233.26035679830042,-56.476596447816505A240,240 0 0,1 185.63137354006443,152.12163934703352L92.81568677003222,76.06081967351676A120,120 0 0,0 116.63017839915021,-28.238298223908252Z" style="fill: rgb(255, 140, 0);"></path>
    		<path class="slice" d="M185.63137354006443,152.12163934703352A240,240 0 0,1 -24.401434441406593,238.75629834038224L-12.200717220703297,119.37814917019112A120,120 0 0,0 92.81568677003222,76.06081967351676Z" style="fill: rgb(208, 116, 60);"></path>
    		<path class="slice" d="M-24.401434441406593,238.75629834038224A240,240 0 0,1 -118.1592151937343,208.89806094073913L-59.07960759686715,104.44903047036956A120,120 0 0,0 -12.200717220703297,119.37814917019112Z" style="fill: rgb(152, 171, 197);"></path>
    		<path class="slice" d="M-118.1592151937343,208.89806094073913A240,240 0 0,1 -187.93929216030935,149.2609207471328L-93.96964608015467,74.6304603735664A120,120 0 0,0 -59.07960759686715,104.44903047036956Z" style="fill: rgb(208, 116, 60);"></path>
    		<path class="slice" d="M-187.93929216030935,149.2609207471328A240,240 0 0,1 -238.39546289616837,-27.70565412549315L-119.19773144808418,-13.852827062746575A120,120 0 0,0 -93.96964608015467,74.6304603735664Z" style="fill: rgb(160, 93, 86);"></path>
    ....
```

It's quite clear that this code is rather complex, even just looking at the slices.  While this surely could be done directly with Blaze using template code, its not likely worth the effort, especially given the D3 is quite performant and capable of producing this for us, while still maintaining reactivity.

### TODO
explain SVG acronym and format
