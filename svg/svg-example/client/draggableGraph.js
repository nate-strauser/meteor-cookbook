var Nodes = new Meteor.Collection(null);//client side only
var Connectors = new Meteor.Collection(null);//client side only
//if these collections are server side, you can easily create graphs that live update for all users as one user makes a change

var createDraggableData = function(){
    for(i = 0; i < 20; i++)
        Nodes.insert({
            x:Math.floor(Math.random()*800),
            y:Math.floor(Math.random()*600)
        });

    for(i = 0; i < 10; i++){
        var source = Random.choice(Nodes.find().fetch());
        var target = Random.choice(Nodes.find({_id:{$ne:source._id}}).fetch());//make sure we dont connect to the source
        Connectors.insert({
            sourceId:source._id,
            targetId:target._id
        });
    }
};
var destoryDraggableData = function(){
    Connectors.find({}).forEach(function(connector){
        Connectors.remove({_id:connector._id});
    });
    Nodes.find({}).forEach(function(node){
        Nodes.remove({_id:node._id});
    });
};

//load some data for the first render
createDraggableData();

Template.dragableGraph.helpers({
    'nodes': function () {
        return Nodes.find();
    },
    'connectors': function () {
        return Connectors.find();
    }
});

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

Template.dragableGraph.events({
    'click input': function () {
        destoryDraggableData();
        createDraggableData();
    }
});
