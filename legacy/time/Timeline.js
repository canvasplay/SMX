(function(smx){

/**
 * SMX Timeline Class
 * @memberof smx.time
 */
class Timeline{



  
  /**
   * creates a new Timeline
   * @param {Node} node node to be used as timeline base
   * @return {Timeline}
   */
	constructor(node){

		if(!node) return;

		//extends with events
		_.extend(this, Backbone.Events);


		/**
		 * Node from which the timeline is created
		 * @type {Node}
		 */

		//define node ref
		this.node = node;

		/**
		 * Current time
		 * @default 0
		 */
		this.time = 0;

		//time cache
		this.time2 = -2;

		//timeline duration
		this.duration = 0;
		
		//limit max update events per second
		this.fps = 2;

		/**
		 * Timer engine used for time tic tacking
		 * @type {smx.time.Timer}
     */
		this.timer = null;

		//used for scrolling
		//this.scroller = null;

		//STATUS FLAGS

		//true if playing
		this.is_playing = false;

		//true when using high speed playback
		//this.is_scrolling = false;

		//is false when its busy :D
		this.is_ready = true;


		//TIMELINE SELECTION
		//Array containing all selected nodes
		this.activeNodes = [];


		//KEYFRAMES
		this.keyFrames = {};


		this.debug = false;
		
		this.initialize();

	}
  
	initialize(){

		this.createTimer();

		this.duration = this.node.time('duration');

		this.synchronize();
	
	}


	createTimer(){
		
			//create timer engine
			this.timer = new smx.time.Timer();
			
			//create observer for timer 'update' event
			this.timer.on('update', this.update, this);

			//create timer engine
			//this.scroller = new smx.time.Timer();
			//this.scroller.fps = 10;
			
			//create observer for timer 'update' event
			//this.scroller.on('update', this.onscroll, this);

			
	}

	destroyTimer(){
		
			if (!this.timer) return;

			this.timer.off('update', this.update);
			
			this.timer.destroy();

			this.timer = null;

			//if (!this.scroller) return;

			//this.scroller.off('update', this.onscroll);
			
			//this.scroller.destroy();

			//this.scroller = null;
			
	}


		plugExtTimer(name, callback){

			if (!this.timer || !name || !callback) return;

			this.timer.plugExtEngine(name, callback);

			return;

		}


		unplugExtTimer(name){

			if (!this.timer || !name) return;

			this.timer.unplugExtEngine(name);
			return;


		}


		/*
		//!!! DEPRECATED -- not in use?
		//better use duration property directly
		this.getDuration = function(){
			return this.duration;
		};
		*/


		synchronize(){
			
			//create/reset empty object
			this.keyFrames = {};

			//get timemarks
			var childs = this.node.find('*');
			
			for (var i=0; i<childs.length;i++){
			
				//get tm
				var child =  childs[i];
				
				//get resulting times
				var _startTime = child.time('offset',this.node);
				var _finishTime = child.time('offset',this.node) + child.time('duration');
				

				//create activation keyframe at start time
				this.addKeyFrame(_startTime, child.id, 1);
				
				//create deactivation keyframe at finish time
				this.addKeyFrame(_finishTime, child.id, 0);
				
			}


			this._optimizeKeyFrames();

			return;
				
		}

		/**
		 * Adds a new keyframe
		 * @param {Integer} t - time position for the keyframe
		 * @param {String} id - keyframe identifier
		 * @param {String} action - action to be permformed
		 * @private
		 */
		_addKeyFrame(t,id,action){

			//if keyframe[t] does not exist create keyframe array
			if (!this.keyFrames[t+'']) this.keyFrames[t+''] = [];

			//the push keyframe in array
			this.keyFrames[t+''].push({ 'id':id, 'action': action });

			return;

		}


    /**
     * Optimizes existing keyframes map
     * @private
     * @summary
		 * keyframes are stored in a plain object not in an array
		 * object properties are the keys time in seconds
		 * so properties may be unordered {5:x,2:y,12:z}
		 * the optimization consists in ordering keyframes object
		 */
		_optimizeKeyFrames(){

			//sort keyframes
			var sorted_keyframes = {};
			var kfs = _.keys(this.keyFrames);
			kfs = _.sortBy(kfs, function(num){ return parseFloat(num); });
			for (var i=0; i< kfs.length;i++){
				sorted_keyframes[kfs[i]] = this.keyFrames[kfs[i]];
			}
			this.keyFrames = sorted_keyframes;

			return;

		}




		/**
	   * Updates timeline time
	   * @param {Number=} time - update timeline at given time
	   * @return {Boolean} success or not
	   */
		update(time){
			
			//check for "is_ready" flag
			if (!this.is_ready) return;

			//check for "is_playing" flag
			//if (!this.is_playing) return;
			
			//process parameter
			var t = (typeof time != 'undefined')? parseInt(time) : false;

			//update time
			if (this.timer) this.time = this.timer.time; //update from timer
			else if(t!== false) this.time = t; // update from parameter
			else return;

			//prevent LEFT timeline offset
			if (this.time<0) this.time = 0;

			//prevent RIGHT timeline offset
			var max = this.duration*1000;
			if (this.time>=max){
				this.time = max;
				this.pause();
				this.finish();
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
							var node = this.node.root().getNodeById(kf.id);
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
							var node = this.node.root().getNodeById(item.id);
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

				

				//update aux time
				this.time2 = t;

			}

				//create timeline event object
				var e = this.buildEventObject(this.node);

				//notify 'update'
				this.trigger('update', e);


			return ;
			
		}

    /**
     * Checks if the given node or node identifier is currently active in the timeline
     * @param {String|Node} node
     */
		isActive(node_or_id){

			var node = node_or_id;

			if (typeof node_or_id == 'string') node = this.node.root().getNodeById(node_or_id);

			if(!node) return;

			if(this.activeNodes.indexOf(node)>=0) return true;

		}
		
    /**
     * @private
     */
	  _enterNode(node){

			//check node
			if(!node) return;

			//check if already active
			if (this.activeNodes.indexOf(node)>=0) return;

			//add to active nodes
			this.activeNodes.push(node);

			//create timeline event object
			var e = this.buildEventObject(node);

			//generic timeline enter event
			this.trigger('enter',e);

			//specific timeline node enter event
			this.trigger('enter:'+node.id,e);

			//debug action
			this._debug('TIMELINE !enter: '+ node.nodeName +'#'+node.id);

			return;

		}

    /**
     * @private
     */
		_exitNode(node){

			//check node
			if(!node) return;

			//check if active
			var index = this.activeNodes.indexOf(node);
			if (index < 0) return;

			//remove from active nodes
			this.activeNodes.splice(index, 1);

			//create timeline event object
			var e = this.buildEventObject(node);


			//generic timeline exit event
			this.trigger('exit',e);

			//specific timeline node exit event
			this.trigger('exit:'+node.id,e);


			//debug action
			this._debug('TIMELINE !exit: '+ node.nodeName +'#'+node.id);

			return;

		}


		/**
     * Plays the timeline
     * @fires play
     */
		play(silent){

			//if is scrolling stop scroll
			//if(this.is_scrolling) this.stopScroll();

			//check for "is_ready" flag
			if (!this.is_ready) return;
			
			//play in offset time become replay
			var max = this.duration*1000;
			if (this.time>=max) return this.replay();

			//update "is_playing" flag
			this.is_playing = true;
			
			//start timer
			if (this.timer) this.timer.start();

			//create timeline event object
			var e = this.buildEventObject(this.node);

			//notify 'play'
			if(!silent) this.trigger('play', e);


			return;
		}
		
  	/**
  	 * Fired every time the timeline performs the `play` action
  	 * @event play
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */


    /**
     * Replays the timeline, performs `seekTo' to 0 and `play`
     */
		replay(){

			//if is scrolling stop scroll
			//if(this.is_scrolling) this.stopScroll();

			//check for "is_ready" flag
			if (!this.is_ready) return;
			
			this.seekTo(0);
			this.play();

			return;
		}


		/**
     * Pauses the timeline
     * @fires pause
     */
		pause(silent){
			
			//if is scrolling stop scroll
			//if(this.is_scrolling) this.stopScroll();

			if(this.is_playing){

				//update "is_playing" flag
				this.is_playing = false;
				
				//stop timer
				if (this.timer) this.timer.stop();
				
				//create timeline event object
				var e = this.buildEventObject(this.node);

				//notify 'pause'
				if(!silent) this.trigger('pause', e);

			}
			
			return;

		}
		
  	/**
  	 * Fired every time the timeline performs the `pause` action
  	 * @event pause
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */
		
		/**
     * Toggles the timeline, will perform `play` or `pause` depending on
     * current timeline status
     */
		toggle(){
		
			//if (!this.is_scrolling && !this.is_playing) this.play();
			if (!this.is_playing) this.play();
			else this.pause();

			return;
		
		}
		
    /**
     * Finishes the timeline
     * @fires finish
     */
		finish(){
		
			//update 'is_playing' flag
			//this.is_playing = false;

			//rewind
			//this.seekTo(0);
			this.pause();
			
			//stop timer
			if (this.timer) this.timer.reset();

			//create timeline event object
			var e = this.buildEventObject(this.node);

			//notify reset
			this.trigger('finish', e);

			return;
			
		}
		
	  /**
  	 * Fired every time the timeline performs the `finish` action
  	 * @event finish
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */


    /**
     * Resets the timeline to 0
     * @fires reset
     */
		reset(){
		
			//update 'is_playing' flag
			this.is_playing = false;
			
			//reset timer
			if (this.timer) this.timer.reset();

			//rewind
			this.seekTo(0);
			
			//notify reset
			this.trigger('reset');

			return;
			
		}
		
  	/**
  	 * Fired every time the timeline performs the `reset` action
  	 * @event reset
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */
		

    /**
     * Seeks current time to the new given time
     * @param {Number} t - target time
     * @fires seek
     */
		seekTo(t){

			//check for "is_ready" flag
			if (!this.is_ready) return;

			//trying seek to start?
			t = (t)? (t<=0)? 0 : t : 0;

			//update time
			if (this.timer) 	this.timer.setTime(t); //from timer
			else				this.update(t);

			//notify seek
			this.trigger('seek',t);

			return;
		
		}
		
  	/**
  	 * Fired every time the timeline performs the `seekTo` action
  	 * @event seek
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */
		
		/*
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
			var max = this.duration*1000;
			if (t>=max){
				t = max;
				this.stopScroll();
			}

			this.seekTo(t);

			return;
		
		};
		*/


		buildEventObject(target){

			var TimelineEvent = {

				'target': target,
				'active': this.activeNodes,
				'time': this.time,
				'duration':this.duration,
				'progress': ((this.time/1000)*100)/this.duration

			};

			return TimelineEvent;

		}




    /**
     * destroys the timeline
     * @fires destroy
     */
		destroy(){

			//destroy timer
			this.destroyTimer();


			//notify destroy
			this.trigger('destroy');

			return;

		}

  	/**
  	 * Fired when the timeline is destroyed
  	 * @event destroy
  	 * @memberof smx.time.Timeline
  	 * @return {TimelineEvent}
  	 */


		_debug(msg){
			if (this.debug) debug.log(msg);
		}


	}


	//expose

	window.smx.time.Timeline = Timeline;


})(window.smx);
