/**
 * Scene Content Node Class
 * 
 */

SMX.document.Scene = new JS.Class(SMX.document.PlayNode,{
 
	/**
     * timeline
     */
	timeline : null,
	
	/**
     * timemarks
     */
	timemarks : [],
	
	timemark_flag: null,
	
	status : SMX.STATUS_CODE.READY,
	

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'SCENE';
			
		this.timeline = null;
		
		this.timemarks = [];
		
		this.timemarkHandler = null,
		
		this.flag_second = null;
		
		this.status = SMX.STATUS_CODE.READY;
		
	},	

	
	enter : function(options){
		
		//check Scene stuff
		//build timeline
		//build timemarks
		//plug a timer to the timeline
		//load videos and resources?
		
		//...
		
		this.buildTimeline();
		
		//this.loadMedia();
		
		this.callSuper();
		
	},
	
	exit : function(options){
		
		if (this.timeline && this.timeline.is_playing) this.pause();
		
		this.callSuper();
		
	},
	
	buildTimeline : function(){
	
		//prevent duplicating timeline instances
		if (this.timeline) return;
		
		//any child has its own timer?
		var use_child_timer = this.hasChildTimer();
		if (SWX_IGNORE_VIDEOSTREAMING) use_child_timer = false;
		
		//creates timeline
		this.timeline = new SMX.timeline.Timeline(use_child_timer);
		
		//flatten scene timemarks
		this.flattenTimeMarks();

		//attach timeline observers
		var _this = this;
		this.timeline.bind('update', function(e){ _this.update() });
		this.timeline.bind('seek', function(e){ _this.notifySeekComplete() });


	},
	
	flattenTimeMarks : function(){

		//ensure timemarks is empty
		this.timemarks = [];

		//create aux array to calculate timings
		var tms = [];
		
		//grab timemarks from all childNodes 
		var _childNodes = this.getChildNodes();
		for (var n=0; n<_childNodes.length;n++){
		
			var __childNodes = _childNodes[n].getChildNodes();
			for (var t=0; t<__childNodes.length;t++){
				
				if (__childNodes[t].nodeName=='TIMEMARK'){
					var _timemark = __childNodes[t];
					/*
					var _second = parseInt(_timemark.startTime);
					this.timemarks[_second+''] = _timemark;
					*/
					tms.push(_timemark);
					
				}
				
			}
			
		}
		
		//synchronize tms
		for (var i=0; i<tms.length;i++){
		
			var tm =  tms[i];
			
			// negative startTime is placed relative to previous timemark
			if ( tm.startTime < 0){
				if (i>0) tm.startTime = tms[i-1].startTime + tms[i-1].duration;
				else tm.startTime = 0;
			}
			
			// negative duration is set relative to next timemark
			if ( tm.duration < 0){
				if (i<tms.length-1){
				
					if (tms[i+1].startTime>0) tm.duration = tms[i+1].startTime - tm.startTime;
					else tm.duration = 1;
				}
				else{
					tm.duration = this.getDuration() - tm.startTime;
				}
			}
		
			//add tm to timemarks collection
			var _second = parseInt(tm.startTime);
			this.timemarks[_second+''] = tm;

		}
		
		
		
	},
	

	destroyTimeline : function(){
		
		//remove observers
		//this.timeline.unbind('update', function(e){ _this.update() });
		//this.timeline.unbind('reset', function(e){ _this.reset() });
		
		//reset timeline
		this.timeline = null;
		
	},
	
	
	loadMedia: function(){
		
		var medias = this.getChildNodes();
		for (var i=0; i< medias.length; i++){
			
			var mediaType = medias[i].nodeName;
			switch(mediaType){
				
				case 'VIDEO':
					
					//USING BRIGHTCOVE
					//DO: _VideoPlayerBrightcove.videoPlayerModule.cueVideoByID(medias[i].videoId);
					//OR: _VideoPlayerBrightcove.requestVideo(medias[i].videoId);
					
					medias[i].buildPlayer();
					
				break;
				
				case 'AUDIO':
				case 'SLIDESHOW':
				default:
				
				break;
				
			}
			
		}
		
	},
	
	hasChildTimer: function(){
		
		//return false by default
		var has_child_timer = false;
		
		//get child nodes
		var child_nodes = this.getChildNodes();
		
		//loop through childs and search for any isTimer!=null
		for (var i=0; i< child_nodes.length; i++){
			if (child_nodes[i].isTimer) has_child_timer = true;
		}
		
		return has_child_timer;
		
	},
	
	getDuration : function(){
		
		if (this.duration) return this.duration;
		else{
			var max_time = 0;
			var _childnodes = this.getChildNodes();
			for (var n =0; n<_childnodes.length;n++){
				var _node = _childnodes[n];
				var _node_duration = _node.getDuration();
				if (_node_duration>max_time) max_time = _node_duration;
			}
			return max_time;
		}
		
	},



	update: function(){
		
		//check for timemarks triggers
		var second = Math.floor(this.timeline.time/1000);
		if (this.timemark_flag != second){
		
			//update timemark_flag
			this.timemark_flag = second;
			
			//throw timemark
			if (this.timemarks[this.timemark_flag+'']){
				this.notifyTimemarkFound();
			}
			
		}
		
		//notify timeline update
		this.notifyUpdate('update');

		//check time overflow
		if (this.timeline.time/1000 >= this.getDuration()){
			this.pause(); this.finish();
		}
		
		
	},


	reset : function(){
		
		if(this.timeline) this.timeline.reset();
		this.update();
		
		this.callSuper();
		
	},
	
	play : function(){
		
		if(!this.timeline){
			this.buildTimeline();
			this.timeline.play();
			this.callSuper();
		
		}
		else{
			//check time overflow
			if (this.timeline.time/1000 >= this.getDuration()){
				//this.pause(); this.finish();
			}
			else{
				this.timeline.play();
				this.callSuper();
			}
		}
		
	},
	
	pause : function(){
		
		if(this.timeline) this.timeline.pause();
		
		this.callSuper();
		
	},

	toggle : function(){
		
		if(this.timeline){
			if(this.timeline.is_playing) this.pause();
			else this.play();
		}
		
		this.callSuper();
		
	},

	seekTo : function(_time){
	
		this.updateStatus(SMX.STATUS_CODE.BUSY);
		
		if(this.timeline && _time!=null){
			this.timeline.seekTo(_time);
			this.trigger('seek');
		}
		
	},
	
	updateStatus : function(_status_code_){
		
		console.log(_status_code_);
		//prevent resetting
		if (this.status == _status_code_) return;
		
		//set status
		this.status = _status_code_;
		
		//trigger 'statuschange' event
		this.trigger('statuschange');
		
	},

	notifyTimemarkFound: function(){
		this.trigger('timemark');
		
	},
	
	notifySeekComplete: function(){
	
		//update node status
		this.updateStatus(SMX.STATUS_CODE.READY);
		
		this.trigger('seekComplete');
		
	},
	
	notifyUpdate: function(){
		this.trigger('update');
		
	}


	
});

