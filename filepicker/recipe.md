# Using Filepicker for uploads and on demand image conversion

[Demo](http://filepicker-plus.meteor.com/) - [Source](filepicker-plus-example/) - [Package](https://atmospherejs.com/package/filepicker-plus)

----------

Dealing with uploads can be difficult to perfect across the myriad of browser and device combinations needed for a real world application.  [Filepicker](https://www.inkfilepicker.com/) takes the pain out of this process and provides some truly excellent extras like social service uploads, downloads/exports, and image conversion.  Using the [filepicker-plus package](https://atmospherejs.com/package/filepicker-plus) we can easily leverage all that filepicker has to offer in our Meteor applications.

This tutiorial assumes you have a filepicker account.  To leverage the image conversion and storage options, you'll need a paid plan.

----------

### Configuring your app

Install the filepicker-plus package with meteorite
```
mrt add filepicker-plus
```

Optionally you can specify your filepicker api key and cdn domain name in your settings file.  If you specify your api key in settings, you can leave it out of any calls to `loadFilePicker()`
```
{
  "public" : {
    "filepicker":{
      "key":"<YOUR API KEY>",
      "cdn_domain":"<YOUR CDN DOMAIN>"
    }
  }
}
```

### Loading filepicker at runtime

Filepicker is a CDN loaded library, the package simply inserts a new script element into the document head which loads the actual library from the filepicker servers.  Most applications do not need filepicker at initial load time, so the package is designed to support for on demand lazy loading.

#### Always load filepicker on initial application load  
This will have filepicker ready and loaded as soon as your application loads in the browser.
```
//client/main.js
Meteor.startup(function(){
	loadFilePicker('<YOUR KEY>');
	//can leave out key if its in settings
});
```

#### Load filepicker as needed when templates are created/rendered  
This will have filepicker ready and loaded as soon a user enters a template that uses filepicker.
```
//client/views/myImage.js
Template.myImage.created = function(){
	loadFilePicker('<YOUR KEY>');
	//can leave out key if its in settings
};
```

#### Load filepicker as needed via iron-router for routes  
This will have filepicker ready and loaded as soon a user enters a route that needs filepicker.
```
//client/router.js
Router.onBeforeAction(function(){
  loadFilePicker('<YOUR KEY>');
  //can leave out key if its in settings
},{only:['<ROUTE NAME>','<ROUTE NAME>']});
```

### Making an upload button

```
<button id="upload">Upload New Profile Image</button>
```
Here we have a simple button in our template.

```
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
           if(FPError && FPError.code !== 101)
            alert(FPError.toString());
        }
	  );
	}
});
```
This is our event handler for the upload button.  Upon click, we tell filepicker to 'pick' a file.  Here we have specified options to limit the upload mimetypes to the image formats we desire and disallowed multiple uploads.  The first callback is the successful upload of a file to filepicker, which receives an [InkBlob](https://developers.inkfilepicker.com/docs/web/#inkblob) as an argument.  The last callback is if an error occured.  For this simple demo, we just alert the user if the error code is not 101.  101 code error is thrown if a user closes the upload dialog without uploading, which isn't really an error that we care to alert the user about.

### What to save in the database
We could save this entire returned InkBlob object to the collection, but for this example we just extract the `filepickerId` which is the last segment of the `url` property.  If you are storing files to a backend service (s3, azure, etc) you will likely want to keep the `key` property, which is the key of the file on the storage service.

What you should save depends on what you want to do with the files after they are uploaded.  If you are just doing image upload and display, you can get away with just the `filepickerId`.  If you plan on directly interacting with the file on the backend storage service (eg file manipulation, video conversion, etc), you'll want to save most, if not all of the properties of the InkBlob.

### Displaying a previously uploaded image

We can use the included template helpers in the filepicker-plus package to easily utilize the on demand image conversion available on paid filepicker plans.

```
<img src="{{filepickerIdToImageUrl myImageId h=200 w=200}}"/>
```
This would scale the image to fit within the max dimensions of 200px by 200px.

```
<img src="{{filepickerIdToImageUrl myImageId h=75 w=75 align='faces' fit='crop'}}"/>
```
This would crop an image to thumbnail size and align to any faces present in the image.


### Using S3 as a backing store

Filepicker provides directions for configuring S3 as a backing store at https://developers.inkfilepicker.com/page/s3/.  Using a backing store is necessary for most real world application as just 'picking' the file actually creates a symlink if a social upload service was used.  The user still has control to change or delete file which you only have a pointer to.  See warning at https://developers.inkfilepicker.com/docs/web/#pick

Once S3 is configured within your filepicker developer portal, the event handler code changes slightly to use the `pickAndStore` instead of just `pick`

```
filepicker.pickAndStore(
	{
		mimetypes: ['image/gif','image/jpeg','image/png'],
		multiple: false
	},{
		access:"public"  //we set the image to public access for this use case
	},
	function(InkBlobs){
		//even though we set multiple to false, we get back an array with 'pickAndStore' vs an object with 'pick'
		var InkBlob = _.first(InkBlobs);

		...//same handling as pick from here on
	},
	function(FPError){
		...//same error handling
	}
);
```

### Using a CDN

To speed up file load time and decrease your usage of image conversion, it is highly recommended that you set up a CDN per the filepicker directions https://developers.inkfilepicker.com/docs/cdn/ .  If your files wont be changing after upload, which is typical, you should set the 'Minimum TTL' to a rather high value, 2592000 (1 Month) works well and should prevent converting the same image to the same specifications within a billing period.

Once you have your CDN configured, add the `cdn_domain` setting to your application settings file.  The helpers will look for this setting, if found, they will return a url which points to your cdn instead of filepicker.com.


### TODO
* Usage in forms
* examples: video, serve file from s3
* show strucutre of inkblob, save all to object in example
* Usage with autoform
* Exports/Downloads
* Making a drop pane
