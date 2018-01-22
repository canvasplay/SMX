(function(smx){

/**
 * TimelineEvent Class
 * @memberof smx.time
 */
class TimelineEvent{

  /**
   * creates a new TimelineEvent
   * @param {Node} node node to be used as timeline base
   * @return {TimelineEvent}
   */
	constructor(playhead){

    /**
     * @type {Node}
     */
		this.target = target;
		
		/**
		 * @type {Node[]}
		 */
    this.active =  playhead.activeNodes;
    
    /**
     * @type {Number}
     */
    this.time =  playhead.time;
    
    /**
     * @type {Number}
     */
    this.duration = playhead.duration;
    
    /**
     * @type {Number}
     */
    this.progress =  ((this.time/1000)*100)/this.duration;

	}
	
}


//expose
window.smx.time.TimelineEvent = TimelineEvent;


})(window.smx);
