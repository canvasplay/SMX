/**
 * Media Content Element Class
 * 
 */

SMX.document.Media = new JS.Class(SMX.document.PlayNode,{

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'MEDIA';
		
		this.sync_behavior = null;
		
		this.sync_status = null;

		this.rel = null;
		
		
		this.offsetTime = 0;
		this.startTime = 0;
		this.duration = 0;
		
		this.videoId = '';	
		
	},	
	
	getDuration : function(){
		
		return this.duration;
		
	},

	play : function(){
	
		debug.log('media played: '+ this.nodeName + ' ' + this.id);
		
		return this.callSuper();
		
	}
		
});


