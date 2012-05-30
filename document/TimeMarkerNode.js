/**
 * TimeMarker Node Class
 * 
 */

SMX.document.TimeMarker = new JS.Class(SMX.document.Media,{
 
	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'TIMEMARKER';
		
		this.startMode = 'PLAY';

		this.finishMode = 'NEXT';
	
		this.sync_behavior = null;
		
		this.sync_status = null;

		this.rel = null;
		
		this.startTime = 0;
	
	},	
 
	getDuration : function(){
		return 0;
	},

	play : function(){
		debug.log('media played: '+ this.nodeName + ' ' + this.id);
	}
	
	
});

SMX.document.TimeMark = new JS.Class(SMX.document.Media,{
 
	
	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'TIMEMARK';
		
		this.startMode = 'PLAY';

		this.finishMode = 'NEXT';
	
		this.sync_behavior = null;
		
		this.sync_status = null;

		this.rel = null;
		
		this.startTime = -1;
		
		this.duration = -1;
	
	},	

	getDuration : function(){
		if (!this.duration) return 1;
		if (this.duration == -1){
			
		}
		else return this.duration;

	},
	
	play : function(){
		debug.log('media played: '+ this.nodeName + ' ' + this.id);
	}
	
	
});


