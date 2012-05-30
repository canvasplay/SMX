/**
 * <<Interface>>
 * Metadata Class
 * Provides informational data
 */


SMX.document.Metadata = new JS.Class({

	'title':'',
	
	'subtitle':'',
	
	'description':'',
	
	'image':'',
	
	'thumbnail':'',
	
	'attachments':'',
	
	'data':null,


	initialize: function(){
	
		this.title='';
		
		this.subtitle='';
		
		this.description='';
		
		this.image=null;
		
		this.thumbnail=null;
		
		this.file=null;
		
		this.data=null;
	
	},
	
	getTitle: function(){
		return this.title || '';
	},
	
	getSubtitle: function(){
		return this.subtitle || '';
	},
	
	getDescription: function(){
		return this.description || '';
	},
	
	getImage: function(){
		return this.image || ( this.thumbnail || null);
	},
	
	getThumbnail: function(){
		return this.thumbnail || ( this.image || null);
	},
	
	getFile: function(){
		return this.file || null;
	},

	getData: function(){
		return this.data;
	}

});
