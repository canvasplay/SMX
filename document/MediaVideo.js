/**
 * Media Content Element Class
 * 
 */

SMX.document.MediaVideo = new JS.Class(SMX.document.Media,{

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'VIDEO';
		
		this.sync_behavior = null;
		
		this.sync_status = null;

		
		this.offsetTime = 0;
		this.startTime = 0;
		this.duration = 0;
		
		this.isTimer = null;
		
		//from+how to load the video ex: 'html5', 'flash', 'youtube','brightcove', ...
		this.sourceType = 'html5';
		
		//aspect 
		this.aspectRatio = '169';
		
		//valid video identifier using sourceType
		this.videoId = null;
		
		//reference to HTML Element
		this.el = null;
		
		//reference to player Object
		this.player = null;
		
	}
		
});


