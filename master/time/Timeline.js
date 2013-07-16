/**

Timeline Controller, Provides basic time handling

@class Timeline
@constructor
@uses Timer
@param node {Node} Node from which to create the timeline, required node using timeline

*/

/*

	· time
	. is_playing
	. is_ready
	· time2s[]
	. keyframes{}

	+ play
	+ replay
	+ next
	+ previous
	+ goTo

	! update
	! play
	! pause
	! seek
	! timemark


*/

(function(smx){


/**



*/

	var SMXTimeline = function(node){

		if(!node) return;

		//extends with events
		_.extend(this, Backbone.Events);


		/**
		
		Node from which the timeline is created
		@property node {Node}

		*/

		//define node ref
		this.node = node;

		/**
		
		Current time
		@property time {Number}
		@default 0

		*/

		//current time
		this.time = 0;

		//time cache
		this.time2 = -2;
		

		//TIMER ENGINES

		/**
		
		Timer engine used for time tic tacking
		@property timer {Object}

		*/

		//used for playing
		this.timer = null;

		//used for scrolling
		this.scroller = null;


		//STATUS FLAGS

		this.is_playing = false;

		this.is_scrolling = false;

		this.is_ready = true;


		//TIMELINE SELECTION
		//Array containing all selected nodes
		this.activeNodes = [];


		//KEYFRAMES
		this.keyFrames = {};


		this.debug = false;


		this.initialize = function(){

			this.createTimer();

			this.updateKeyFrames();

			return;
		};


		this.createTimer= function(){
		
			//create timer engine
			this.timer = new smx.time.Timer();
			
			//create observer for timer 'update' event
			this.timer.on('update', this.update, this);

			//create timer engine
			this.scroller = new smx.time.Timer();
			//this.scroller.fps = 10;
			
			//create observer for timer 'update' event
			this.scroller.on('update', this.onscroll, this);

			return;
			
		};

		this.destroyTimer= function(){
		
			if (!this.timer) return;

			this.timer.off('update', this.update);
			
			this.timer.destroy();

			this.timer = null;

			if (!this.scroller) return;

			this.scroller.off('update', this.onscroll);
			
			this.scroller.destroy();

			this.scroller = null;

			return;
			
		};


		this.plugExtTimer = function(name, callback){

			if (!this.timer || !name || !callback) return;

			this.timer.plugExtEngine(name, callback);

			return;

		};


		this.unplugExtTimer = function(name){

			if (!this.timer || !name) return;

			this.timer.unplugExtEngine(name);

			return;

		};


		this.getDuration = function(){

			return this.node.getDuration();

		};


		this.updateKeyFrames = function(){
			
			//create/reset empty object
			this.keyFrames = {};


			//get timemarks
			var childs = this.node.find('*');
			
			for (var i=0; i<childs.length;i++){
			
				//get tm
				var child =  childs[i];
				

				//get resulting times
				var _startTime = child.offset(this.node);
				var _finishTime = child.offset(this.node) + child.getDuration();
				

				//create activation keyframe at start time
				this._addKeyFrame(_startTime, child.id, 1);
				
				//create deactivation keyframe at finish time
				this._addKeyFrame(_finishTime, child.id, 0);
				

			}


			this._sortKeyFrames();

			return;
				
		};

		this._addKeyFrame = function(t,id,action){

			//if keyframe[t] does not exist create keyframe array
			if (!this.keyFrames[t+'']) this.keyFrames[t+''] = [];

			//the push keyframe in array
			this.keyFrames[t+''].push({ 'id':id, 'action': action });

			return;

		};


		this._sortKeyFrames = function(){

			//sort keyframes
			var sorted_keyframes = {};
			var kfs = _.keys(this.keyFrames);
			kfs = _.sortBy(kfs, function(num){ return parseFloat(num); });
			for (var i=0; i< kfs.length;i++){
				sorted_keyframes[kfs[i]] = this.keyFrames[kfs[i]];
			}
			this.keyFrames = sorted_keyframes;

			return;

		};




		/**
	     * Method: Update timeline
	     * @param {Number} (optional) update timeline at given time
	     * @return {Boolean} success or not
	     */
		this.update = function(time){
			
			//check for "is_ready" flag
			if (!this.is_ready) return;

			//check for "is_playing" flag
			//if (!this.is_playing) return;
			
			//process parameter
			var t = (typeof time != 'undefined')? parseInt(time) : false;

			//update time
			if (this.timer)	this.time = this.timer.time; //update from timer
			else if(t!== false) this.time = t; // update from parameter
			else return;

			//prevent LEFT timeline offset
			if (this.time<0) this.time = 0;

			//prevent RIGHT timeline offset
			var max = this.getDuration()*1000;
			if (this.time>=max){
				this.time = max;
				this.pause();	
			}


			//check for keyframes
			t = Math.floor(this.time/1000);
			if (this.time2 != t){
			
				var diff = t - this.time2;
				if (diff > 0 && Math.abs(diff) <= 1){
			
					//is linear progress

					//get keyframes for this frame
					var kfs = this.keyFrames[t+''];

					//exist keyframes?
					if (kfs){
					
						//debug.log('keyframe found at '+t);

						for (var i=0; i<kfs.length; i++ ){

							var kf = kfs[i];
							var node = this.node.getDocument().getNodeById(kf.id);
							var action = kf.action;

							if(action>0)	this._enterNode(node);
							else{
								var last_frame = Math.floor(max/1000);
								if (t!=last_frame) this._exitNode(node);	
							}
							

						}

						
					}

				}
				else{

					//is not linear progress

					//get keyframes names: ['0','5','12',...]
					var kfs = _.keys(this.keyFrames);
					
					//aux array for active nodes
					var active_nodes = [];

					//loop trough keyframes before time t
					for (var k =0; k < kfs.length && parseInt(kfs[k])<=parseInt(t); k++){

						var kf = this.keyFrames[kfs[k]];

						for (var i=0; i<kf.length; i++ ){

							var item = kf[i];
							var node = this.node.getDocument().getNodeById(item.id);
							var action = item.action;

							var index = active_nodes.indexOf(node);

							if(action>0) active_nodes.push(node);
							else active_nodes.splice(index, 1);	
							

						}

					}


					//perform resulting 'exit' nodes
					var need_exit = [];
					for (var i=0; i< this.activeNodes.length; i++){
						var node = this.activeNodes[i];
						if(active_nodes.indexOf(node)<0){
							need_exit.push(node);
						}
						
					}
					for (var i=0; i< need_exit.length; i++) this._exitNode(need_exit[i]);

					//perform resulting 'enter' nodes
					for (var i=0; i< active_nodes.length; i++) this._enterNode(active_nodes[i]);


				}



				//this._debug('-------------------------------');
				//for (var i=0; i< this.activeNodes.length; i++) debug.log(''+this.activeNodes[i].nodeName +'#'+this.activeNodes[i].id);

				//update time2
				this.time2 = t;
				
			}


			//console.log(this.activeNodes);

			//create timeline event object
			var e = this.buildEventObject(this.node);

			//notify 'update'
			this.trigger('update', e);

			return ;
			
		};


		this.isActive = function(node_or_id){

			var node = node_or_id;

			if (typeof node_or_id == 'string') node = this.node.getDocument().getNodeById(node_or_id);

			if(!node) return;

			if(this.activeNodes.indexOf(node)>=0) return true;

		};

		this._enterNode = function(node){

			//check node
			if(!node) return;

			//check if already active
			if (this.activeNodes.indexOf(node)>=0) return;

			//add to active nodes
			this.activeNodes.push(node);

			//create timeline event object
			var e = this.buildEventObject(node);

			//notify action
			this.trigger('enter',e);

			//debug action
			this._debug('TIMELINE !enter: '+ node.nodeName +'#'+node.id);

			return;

		};

		this._exitNode = function(node){

			//check node
			if(!node) return;

			//check if active
			var index = this.activeNodes.indexOf(node);
			if (index < 0) return;

			//remove from active nodes
			this.activeNodes.splice(index, 1);

			//create timeline event object
			var e = this.buildEventObject(node);

			//notify action
			this.trigger('exit',e);

			//debug action
			this._debug('TIMELINE !exit: '+ node.nodeName +'#'+node.id);

			return;

		};


		/**
	     * Play timeline
	     * @return {Boolean} success or not
	     */
		this.play = function(){

			//if is scrolling stop scroll
			if(this.is_scrolling) this.stopScroll();

			//check for "is_ready" flag
			if (!this.is_ready) return;
			
			//play in offset time become replay 
			var max = this.getDuration()*1000;
			if (this.time>=max) return this.replay();

			//update "is_playing" flag
			this.is_playing = true;
			
			//start timer
			if (this.timer) this.timer.start();

			//create timeline event object
			var e = this.buildEventObject(this.node);

			//notify 'play'
			this.trigger('play', e);


			return;
		};



		this.replay = function(){

			//if is scrolling stop scroll
			if(this.is_scrolling) this.stopScroll();

			//check for "is_ready" flag
			if (!this.is_ready) return;
			
			this.seekTo(0);
			this.play();

			return;
		};


		/**
	     * Pause timeline
	     * @return {Boolean} success or not
	     */
		this.pause = function(){
			
			//if is scrolling stop scroll
			if(this.is_scrolling) this.stopScroll();

			if(this.is_playing){

				//update "is_playing" flag
				this.is_playing = false;
				
				//stop timer
				if (this.timer) this.timer.stop();
				
				//create timeline event object
				var e = this.buildEventObject(this.node);

				//notify 'pause'
				this.trigger('pause', e);

			}
			
			return;

		};
		
		/**
	     * Toggle play/pause timeline
	     * @return {Boolean} success or not
	     */
		this.toggle = function(){
		
			if (!this.is_scrolling && !this.is_playing) this.play();
			else this.pause();

			return;
		
		};
		


		this.reset = function(){
		
			//update 'is_playing' flag
			this.is_playing = false;
			
			//reset timer
			if (this.timer) this.timer.reset();

			//rewind
			this.seekTo(0);
			
			//notify reset
			this.trigger('reset');

			return;
			
		};
		


		this.seekTo = function(t){

			//check for "is_ready" flag
			if (!this.is_ready) return;

			//trying seek to start?
			t = (t)? (t<=0)? 0 : t : 0;

			//update time
			if (this.timer)		this.timer.setTime(t); //from timer
			else				this.update(t);

			//notify seek
			this.trigger('seek',t);

			return;
		
		};
		

		this.scroll = function(factor){

			if (!this.scroller) return;

			if(!_.isNumber(factor) || factor===0){

				//set scroll factor
				this.stopScroll();

				return;

			}

			//pause timeline while scrolling
			this.pause();

			//update 'is_scrolling' flag
			this.is_scrolling = true;

			//set scroll factor
			this.scroller.factor = factor;

			//sync scroller with timer
			this.scroller.time = this.timer.time;

			//start scroll timer if is not already started
			if(this.scroller.paused) this.scroller.start();


			return;
		
		};

		this.stopScroll = function(){

			if (!this.scroller) return;

			//set scroll factor
			this.scroller.factor = 0;

			//stop scroll timer
			this.scroller.stop();

			//update 'is_scrolling' flag
			this.is_scrolling = false;

			return;
		
		};

		this.onscroll = function(time){

			if(this.is_playing || !this.is_scrolling){
				this.stopScroll();	return;
			}

			//process parameter
			var t = (typeof time != 'undefined')? parseInt(time) : false;

			//update time
			if (this.scroller)	t = this.scroller.time; //update from timer

			//prevent LEFT timeline offset
			if (t<0){
				t = 0;
				this.stopScroll();
			}

			//prevent RIGHT timeline offset
			var max = this.getDuration()*1000;
			if (t>=max){
				t = max;
				this.stopScroll();
			}

			this.seekTo(t);

			return;
		
		};


		this.buildEventObject = function(target){

			var TimelineEvent = {

				'target': target,
				'active': this.activeNodes,
				'time': this.time,
				'duration':this.getDuration()

			};

			return TimelineEvent;

		};





		this.destroy = function(){

			//destroy timer
			this.destroyTimer();


			//notify destroy
			this.trigger('destroy');

			return;

		};


		this._debug = function(msg){
			if (this.debug) debug.log(msg);
		}



		this.initialize();


		return this;


	};


	//expose

	window.smx.time.Timeline = SMXTimeline;


})(window.smx);
