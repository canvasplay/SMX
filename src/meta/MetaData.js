/**
*
*	Metadata Model
*
*	A pluggable model to store metadata from single smx node.
*	Metadata is considered the "public content data" from an smx node
*	
*	Metadata attributes can be named for convenience, attributes defined
*	here are just as basic example temlate.
*
*	Metadata attributes may be instanced dynamically while XML parsing process
*
*	All SMX nodes matching attribute names starting with "meta-" will create an attribute in Metadata Model
*	meta-attr_name="attr_value"	->	node.meta.set('attr_name','attr_value')
*	meta-title="..."	->	node.meta.set('title','...')
*	
* 	@class Metadata
*
*/

(function() {


	var Metadata = Backbone.Model.extend({

		defaults:{

			'title': undefined,
			
			'subtitle': undefined,
			
			'description': undefined,
			
			'image': undefined,
			
			'thumbnail': undefined,
			
			'attachments': undefined,
			
			'data': undefined

		},

		initialize: function(){
			return this;
		}
		
	});	

	//expose
	smx.meta.MetaData = Metadata;

})(window.smx);
