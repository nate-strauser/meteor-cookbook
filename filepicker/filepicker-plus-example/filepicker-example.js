Images = new Meteor.Collection('images');

if (Meteor.isClient) {
  Template.myImage.created = function(){
    loadFilePicker();
  };

  Template.myImage.events({
    'click #upload': function () {
      filepicker.pick(
        {
          mimetypes: ['image/gif','image/jpeg','image/png'],
          multiple: false
        },
        function(InkBlob){
          var image = Images.findOne({userId:Meteor.userId()});
          if(image){
            Images.update({_id:image._id},
            {
              $set:{
                filepickerId:_.last(InkBlob.url.split("/"))
              }  
            });
          }else{
            Images.insert({
              userId:Meteor.userId(),
              filepickerId:_.last(InkBlob.url.split("/")),
              createdAt:new Date() //this isnt guarnteed accurate, but its ok for this simple demo
            });
          }
        },
        function(FPError){
          alert(FPError.toString());
        }
      );
    }
  });

  Template.myImage.helpers({
    'image': function () {
      return Images.findOne({userId:Meteor.userId()});
    }
  });

  Template.profileImages.helpers({
    'images': function () {
      return Images.find({},{sort:{createdAt:-1},limit:100});
    }
  });
}