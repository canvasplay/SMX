(function(smx){

/**
 * PlayheadEvent Class
 * @memberof smx
 */
class PlayheadEvent{

  /**
   * creates a new PlayheadEvent
   * @param {Node} node node to be used as timeline base
   */
	constructor(playhead){
	 
    /**
     * @type {Node}
     */
		this.target = target;
		
		/**
		 * @type {Node[]}
		 */
    this.path =  playhead.path;
    
    /**
     * @type {Node[]}
     */
    this.entered = null;
    
     /**
     * @type {Node[]}
     */
    this.exited = null;
    
    /**
     * @type {Number}
     */
    this.timeStamp =  Date.now();

	}
	
}

window.smx.PlayheadEvent = PlayheadEvent;

})(window.smx);