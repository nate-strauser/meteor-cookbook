# Reactive and Interactive SVG Graphs, optionally using D3

Dates and times are vital to almost all applications and can be quite tricky to properly utilize.  Fortunately, by using moment and some other packages you can make it quite simple for your meteor applications.

----------

Example application running at http://reactive-svg-d3-meteor.com/ with code at https://github.com/nate-strauser/meteor-cookbook/tree/master/svg/svg-example

----------



reactive
interactive

http://bost.ocks.org/mike/bar/2/
http://www.chartjs.org/docs/


Integration levels with SVG and D3
1. Meteor renders and updates SVG directly, no D3
2. Meteor renders and updates SVG directly, D3 is used for interactivity
3. D3 renders and updates SVG, Meteor orchestrates D3 execution and updates


Examples
Simple Scatter Plot and Simple Vertical Bar Graph




live dataset and make a line graph against it - boundaries - how can i tie into d3 to update in real time?

---

raw svg doesnt work well for anything beyond very simple graphs - bar is doable, pie is a bit crazy


using deps.autorun to rerun chart code when data changes


--

make this example be data baked - http://bl.ocks.org/dbuezas/9306799


do this in d3 and raw - show steps to translate
http://bl.ocks.org/mbostock/3885304