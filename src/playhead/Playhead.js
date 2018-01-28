(function(global, _, Backbone, smx){


/**
* SMX Playhead class
* @memberof smx
*/
class Playhead{

	/**
	 * Create a playhead
	 * @param {Document} document - The document to navigate through
	 */
	constructor(doc){
    
		//document argument is required!
		if(!doc) return;

		//extend with events on, off, trigger
		_.extend(this, Backbone.Events);


		/**
		 * The document to navigate through
		 * @type {Document}
		 * @private
		 */
		this._document = doc;
		

		/**
		 * Contains all nodes in which playhead has entered
		 * List ordered from outter to inner [root, ..., currentnode]
		 * @type {Array.<Node>}
		 * @private
		 */
		this._path = [];


		/**
		 * Currently active timeline
		 * @type {Timeline}
		 */
		this.timeline = null;

		/**
		 * List of nodes entered in last movement
		 * @type {Array.<Node>}
		 * @private
		 */
		this._entered = [];

		/**
		 * List of nodes exited in last movement
		 * @type {Array.<Node>}
		 * @private
		 */
		this._exited = [];
	
	}


	/**
	 * Gets the associated document
	 * @type {Document}
	 * @readonly
	 */
	get document(){
		return this._document;
	}


	/**
	 * Contains all nodes in which playhead has entered
	 * List ordered from outter to inner [root, ..., currentnode]
	 * @type {Array.<Node>}
	 * @readonly
	 */
	get path() {
		return this._path;
	}

	/**
	 * Gets the last node in the path which is the head
	 * @type {Node}
	 * @readonly
	 */
	get head(){
		return this._path[this._path.length - 1];
	}

	/**
	 * Gets the first node in the path which is the root
	 * @type {Node}
	 * @readonly
	 */
	get root(){
		return this._path[0];
	}


	/**
	 * Property getter
	 * @param {String} key - property key name
	 * @return {Node} property value
	 * @summary Composes a list of functions.
	 */
	get(key) {

		switch (key) {
			case 'selected':
				return this._path;
				break;
			case 'head':
				return this._path[this._path.length - 1];
				break;
			case 'root':
				return this._path[0];
				break;
			case 'entered':
				return this._entered;
				break;
			case 'exited':
				return this._exited;
				break;
			default:
				return;
				break;

		}

	}

	/**
	 * Performs play action
	 * @param {String} id node identifier
	 */
	play(id){

		var cnode = null;
		var options = { };

		//get target node
		if (!id)	cnode = this.get('head');
		else		cnode = this.document.getNodeById(id);

 		if(!cnode) return;

 		//check for node accesibility
		if (!cnode.isAccesible()) return;

		//if current node has timeline return node play result
		//if( cnode.timeline && this.timeline ) return this.timeline.play();
		if( this.timeline ) return this.timeline.play();

		//if has childs get firstchild
		//else get next node in the global timeline
		var first = cnode.first; if(first) cnode = first;

		if (!cnode.isAccesible()) return;

		return this.go(cnode,options);

	}

	/**
	 * performs pause action
	 */
	pause(){

		//call timeline pause
		if(this.timeline) this.timeline.pause();
		
		return;
	}

	/**
	 * performs toggle action, alternating from playing to paused
	 */
	toggle(){

		//call timeline toggle
		if(this.timeline) this.timeline.toggle();

		return;

	}

	/**
	 * navigate to next Node if exists
	 */
	next(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//get next node
		var tnode = cnode.next; if (!tnode) return;
		
		//check for accesibility
		if(!tnode.isAccesible()) return;

		//go to next node using known swap type and passing recived params
		return this.go(tnode,{'swap_type':'next'});
		
	}

	/**
	 * navigate to previous Node if exists
	 */
	previous(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//get previous node
		var tnode = cnode.previous; if (!tnode) return;

		//check for accesibility
		if (!tnode.isAccesible()) return;

		//go to previous node using known swap type and passing recived params
		return this.go(tnode,{'swap_type':'previous'});
		
	}
	
	/**
	 * navigate inside current Node if posible
	 */
	inside(){
	
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//inside navigation is only allowed above nodes without timeline
		if (cnode.timeline) return;
		
		//get children nodes
		let children = cnode.children;

		//no children?
		if (!children.length) return;

		//get first child
		var tnode = children[0];

		//check for accesibility
		if (!tnode.isAccesible()) return;

		//go to child node using known swap type and passing recived params
		return this.go(tnode,{ 'swap_type':'inside' });
		
	}

	/**
	 * navigate outside current Node if posible
	 */
	outside(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//has parent node?
		if(!cnode.parent) return;

		//get parent node
		var tnode = cnode.parent;

		//go to child node using known swap type and passing recived params
		return this.go(tnode,{ 'swap_type':'outside' });
		
	}

	/**
	 * navigates up root
	 */
	reset(){
		
		//get root node
		var rootnode = this.get('root');

		//root node is required!
		if(!rootnode) return;

		//go to root node
		return this.go(rootnode);
		
	}
	

	/**
	 * Goes to next node in flat tree mode
	 */
	forward(){
		
		let tnode, cnode, children;
		
		//get current node
		cnode = this.get('head');
		
		//no current node? ignore
		if(!cnode) return;

		if(!cnode.time('timeline') && !cnode.time('timed')){
		  
			children = cnode.children;
			
			if(!children.length)
				tnode = cnode.next;
			else
				tnode = cnode.first;
			
		}
		else{
			tnode = cnode.next;
		}


		if(!tnode){

			var parent = cnode.parent;
			while(parent && !tnode){
				tnode = parent.next;
				parent = parent.parent;
			}

		}

		
		if (!tnode.isAccesible()) return;
		return this.go(tnode);

	}

	/**
	 * Goes to previous node in flat tree mode
	 */
	backward(){
		
		var tnode;
		
		if(!this.head) return;
		
		if(this.head.previous){
		  tnode = this.head.previous;
		}
    else if(this.head.parent){
     tnode = this.head.parent
    }
    
    if(!tnode || !tnode.isAccesible()) return;
		return this.go(tnode);

	}

	/**
	 * Go to given node
	 */
	go(ref, opt){

		//is ref a keyword?
		//keywords always strings prefixed with '!'
		if(_.isString(ref) && ref.indexOf('!') === 0){

			//remove '!' prefix
			var keyword = ref.substr(1);

			//define known keywords
			var keywords = [
			  'play',
			  'pause',
			  'toggle',
			  'next',
			  'previous',
			  'inside',
			  'outside',
			  'root'
			];

			//is known keyword?
			if(keywords.indexOf(keyword)){
				
				//get go method by keyword
				var method = this[keyword];

				//tries executing the method
				try{
					return _.bind(method,this)();
				}
				catch(e){
					throw new Error( 'KEYWORD EXEC ERROR "!'+ keyword +'"');
				}

			}

			//unknow keyword...
			throw new Error( 'UNKNOWN KEYWORD "!"'+ keyword +'"' );

		}


		//normalize given ref, maybe be string or SMXNnode
		var tnode = (_.isString(ref))? this.document.getNodeById(ref) : ref;

		// GET CURRENT NODE
		var cnode = this.get('head');
			
		//NODE NOT FOUND
		if (!tnode)
		  throw new Error('NODE WAS NOT FOUND');
		
		//TARGET NODE == CURRENT NODE ?
		//if (cnode) if (cnode.id == tnode.id) throw new Error('201');
		if (cnode == tnode) return cnode;

		//IS TARGET NODE INSIDE TIMELINE?
		//playhead cannot access nodes inside a timeline
		if (tnode.time('timed'))
			throw new Error('NODE "'+ tnode.id +'" IS NOT VISITABLE');

		//IS TARGET NODE ACCESIBLE ?
		if (!tnode.isAccesible() && !global.app.config.FREE_ACCESS)
			throw new Error('NODE "'+ cnode.id +'" IS NOT ACCESIBLE');

		
		

		/**

		HERE YOU CAN PLUG ASYNC NAVIGATION CONTROLLERS... like SCORMX or VMSCO or...

		*/

		try{
	
			var async = this.requestAsyncNodeAccess(tnode);

			if(async){

				this.trigger('sync', async);
				return;

			}

		}
		catch(e){}

		/*****/




		//INITIALIZE OPTIONS
		var options = {	'swap_type': null };
		if (opt){ options = { 'swap_type': opt.swap_type || null } }

		
		



		//RESET PRIVATE MOVE REGISTRY
		this._entered = []; this._exited = [];



		//if 'autoplay' behavior is enabled call
		if (tnode.autoplay===true && tnode.children.length>0){
			return this.go(tnode.cnode.getFirstChild(),options);
		}





		//We are going to check for multiple node swaping posibilities.
		//Being selective should be faster than using the iterative method.
		
		//if swap_type parameter was not defined tries to autodetect direct values
		if (!options.swap_type){
		
			if (!cnode)
			  options.swap_type = 'from_root';
			else if(cnode.isParentOf(tnode))
			  options.swap_type = 'child';
			else if(tnode.isParentOf(cnode))
			  options.swap_type = 'parent';
			else if(cnode.parent && tnode.parent && cnode.parent.id === tnode.parent.id)
				options.swap_type = 'sibling';
		
		}
		
		
		//Do all required 'enter' and 'exit' calls for node navigation
		switch(options.swap_type){
		
			case 'outside':
				//exit from current
				this._exitNode(cnode);
				//we are already inside tnode because tnode is first parent of cnode
				//but re-enter for trigger 'enter' event
				this._enterNode(tnode);
			break;
			case 'inside':
				//enter in child node
				this._enterNode(tnode);
			break;
			case 'next':
			case 'previous':
			case 'sibling':
				//exit from current
				this._exitNode(cnode);
				//enter in sibling node
				this._enterNode(tnode);
			break;
			case 'from_root':
				//enter all nodes from root to tnode
				this._enterStraight(null,tnode);
			break;
			case 'child':
				//enter all nodes cnode to tnode
				this._enterStraight(cnode,tnode);
			break;
			case 'parent':
			
				//navigates parents from cnode until reach tnode
				let ref_node = cnode;
				let tnode_found = false;
				while (ref_node.parent && !tnode_found){
					//exit from ref_node
					this._exitNode(ref_node);
					//update ref_node
					ref_node = ref_node.parent;
					//tnode found?
					if (ref_node.id == tnode.id) tnode_found = true;
				}
				
				//we are already inside tnode because tnode is parent of cnode
				//but re-enter for trigger 'enter' event
				this._enterNode(tnode);
				
			break;
			default:
				//iterative method
				this._goIterative(cnode,tnode);
			break;
		}
		


		//TIMELINE?

		//create timeline, will only be created if its possible and if its needed
		if(tnode.time('timeline')) this._createTimeline();


		//FIRE EVENTS

		//FIRE 'LEAVE' EVENT
		if (cnode){
			//fire generic 'leave' event in resulting current node
			this.trigger('leave',cnode);
			//fire specific node 'leave' event
			this.trigger('leave:'+cnode.id,cnode);
		}



		/* NOSTOP ATTRIBUTE WARNING VERY EXPERIMENTAL CODE BELOW */

		// node having the 'nostop' attribute prevents the playhead to stop on it
		var nostop = tnode.has('nostop');

		if (nostop && tnode.id != this.get('root').id){

			var entered = this.get('entered');
			var exited = this.get('exited');

			if (entered.length>0){
				if( entered[entered.length-1].id == tnode.id){

					if (tnode.children.length>0){
						return this.inside();
					}
					else{
						if(tnode.parent){
							return this.outside();
						}
						else{
							this.root();
						}
					}

				}
				else{
					this.root();
				}

			}
			else if (exited.length>0){

				if( exited[0].isChildOf(tnode) ){
					if(tnode.parent){
						return this.outside();
					}
					else{
						this.root();
					}
				}
				else{
					this.root();
				}

			}
			else{
				this.root();
			}

		}
		else{

			//DEFAULT BEHAVIOIR


			//FIRE 'STAY' EVENT
			//fire generic 'stay' event in resulting current node
			this.trigger('stay',tnode);
			//fire specific node 'stay' event
			this.trigger('stay:'+tnode.id,tnode);

			//FIRE 'READY' EVENT
			//notify node navigation completed
			this.trigger('ready',tnode);



			//return resultant current node
			return this.get('head');


		}

		
		
	}





	/* PRIVATE METHODS */



	/**
	 * Performs a head transition from current to target node
	 * @private
	 * @param {Node} current - current node
	 * @param {Node} target - target node
	 */
	_goIterative(cnode,tnode){
	
		//ok! we are going to navigates from cnode(current node) to tnode(target node). Lets go!
		
		//navigates from root
		if(!cnode)
			this._enterStraight(null,tnode);
	
		else{
		//navigates from current node
		
			//looks parents for a common parent between current and target node
			let ref_node = cnode;
			let common_parent = null;
			while (ref_node && ref_node.parent && !common_parent){

				//exit nodes at same that searches
				this._exitNode(ref_node);

				ref_node = ref_node.parent;
				if (ref_node.isParentOf(tnode)) common_parent = ref_node;
			}
			
			//was common parent found?
			if (common_parent){
				this._enterStraight(common_parent,tnode);
			}
			else{
				this._enterStraight(null, tnode);
			}

		}
		
		
	}

	/**
	 * Performs a head transition from parent to child node
	 * @private
	 * @param {Node} parent - parent node
	 * @param {Node} child - child node
	 */
	_enterStraight(parentnode,child_node){
	
		//Performs iterative 'enter' method on child nodes from parentnode to a known child_node

		//check if child_node is not child of parentnode
		if( parentnode && !parentnode.isParentOf(child_node) ) return;
		
		//creates a parent nodes array from child node
		var child_node_parents = [];
		
		//looks parents and fills the array until reach known parentnode
		var ref_node = child_node;
		var parentnode_reached = false;
		while (ref_node && ref_node.parent && !parentnode_reached){
			ref_node = ref_node.parent;
			if(parentnode) if(ref_node.id == parentnode.id) parentnode_reached = true;

			if(ref_node && !parentnode_reached) child_node_parents.unshift(ref_node);
		}
		
		//call 'enter' method in each parent node
		for (var p=0; p<child_node_parents.length; p++){
			this._enterNode(child_node_parents[p]);
		}
		
		//call 'enter' method in child node
		this._enterNode(child_node);
	
	}
		
	/**
	 * Enters in given node
	 * @private
	 * @param {Node} node
	 * @fires enter
	 */
	_enterNode(_node){

		//prevent re-enter in a node
		var selectedIds = _.map(this._path,'id');
		if(_.includes(selectedIds,_node.id)) return;

		//update selection array
		this._path.push(_node);

		//update last move registry
		this._entered.push(_node);

		//fire generic 'enter' event
		this.trigger('enter', _node);

		//fire specific node 'enter' event
		this.trigger('enter:'+_node.id, _node);

		return;
	}

	/**
	 * Exits from given node
	 * @private
	 * @param {Node} node
	 */
	_exitNode(_node){

		//clear timeline
		if(this.timeline) this._destroyTimeline();

		//update blocks array
		this._path.pop();

		//update last move registry
		this._exited.push(_node);

		//fire generic 'exit' event
		this.trigger('exit', _node);

		//fire specific node 'exit' event
		this.trigger('exit:'+_node.id, _node);

		return;

	}

	/**
	 * Fired when entering to any node
	 * @event enter
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired just after `enter` but for a specific node
	 * @event enter:id
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired when exiting from any node
	 * @event exit
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired just after `exit` but for a specific node
	 * @event exit:id
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired every time a head change occurs and stays on any node
	 * @event stay
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired just after `stay` but for a specific node
	 * @event stay:id
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired every time a node stops being the head
	 * @event leave
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired just after `leave` but for a specific node
	 * @event leave:id
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired every time the playhead finishes all operations and goes idle
	 * @event ready
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */

	/**
	 * Fired when playhed goes to sync mode
	 * @event sync
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */


 



	/**
	 *	TIMELINE HANDLING
	 *	These methods just propagate the timeline events as nested playhead events
	 *	Useful for listening to timeline events even when timeline does not exists
	 *	Also useful for having a centralized playhead activity
	 */

	/**
	 * @private
	 */
	_createTimeline(){
	
		var cnode = this.get('head');
		if(!cnode) return;

		//destroy current timeline if needed
		if (this.timeline) this._destroyTimeline();
		
		//create timeline
		this.timeline = new smx.time.Timeline(cnode);
		
		//setup listeners
		this._bindTimelineListeners();

		return;
	}


	/**
	 * @private
	 */
	_destroyTimeline(){
		
		//remove listeners
		this._unbindTimelineListeners();

		//destroy timeline
		this.timeline.destroy();

		//reset timeline
		this.timeline = null;
		
		return;
	}


	/**
	 * Binds listeners to timeline events to propagate them up as playhead
	 * events prefixed with `timeline:`, useful for listening to timeline
	 * events even when timeline does not exists. Also useful for having a
	 * centralized playhead activity.
	 * @private
	 */
	_bindTimelineListeners(){
	
		if (!this.timeline) return;

		this.timeline.on('play', this._onTimelinePlay, this);
		this.timeline.on('pause', this._onTimelinePause, this);
		this.timeline.on('update', this._onTimelineUpdate, this);
		this.timeline.on('seek', this._onTimelineSeek, this);
		this.timeline.on('reset', this._onTimelineReset, this);
		this.timeline.on('enter', this._onTimelineEnter, this);
		this.timeline.on('exit', this._onTimelineExit, this);
		this.timeline.on('finish', this._onTimelineFinish, this);

		return;
	}

	/**
	 * Unbinds all timeline event listeners
	 * @private
	 */
	_unbindTimelineListeners(){
	
		if (!this.timeline) return;

		this.timeline.off('play', this._onTimelinePlay, this);
		this.timeline.off('pause', this._onTimelinePause, this);
		this.timeline.off('update', this._onTimelineUpdate, this);
		this.timeline.off('seek', this._onTimelineSeek, this);
		this.timeline.off('reset', this._onTimelineReset, this);
		this.timeline.off('enter', this._onTimelineEnter, this);
		this.timeline.off('exit', this._onTimelineExit, this);
		this.timeline.off('finish', this._onTimelineFinish, this);
	
		return;
	}

	/**
	 * @event timeline:play
	 * @memberof smx.Playhead
	 */
	_onTimelinePlay(event){
		this.trigger('timeline:play', event); return;
	}

	/**
	 * @event timeline:pause
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelinePause(event){
		this.trigger('timeline:pause', event); return;
	}

	/**
	 * @event timeline:update
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineUpdate(event){
		this.trigger('timeline:update', event);	return;
	}

	/**
	 * @event timeline:seek
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineSeek(event){
		this.trigger('timeline:seek', event); return;
	}

	/**
	 * @event timeline:finish
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineFinish(event){
		this.trigger('timeline:finish', event); return;
	}

	/**
	 * @event timeline:reset
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineReset(event){
		this.trigger('timeline:reset', event); return;
	}

	/**
	 * @event timeline:enter
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineEnter(event){
		this.trigger('timeline:enter', event); return;
	}

	/**
	 * @event timeline:exit
	 * @memberof smx.Playhead
	 * @return {PlayheadEvent}
	 */
	_onTimelineExit(event){
		this.trigger('timeline:exit', event); return;
	}


	/**
	 * check wether a node access should be async or not, default to false, needs overwritting
	 */
  requestAsyncNodeAccess(node){
  	
  	return false;
  
  }

}






//expose to global
smx.Playhead = Playhead;


})(window, window._, window.Backbone, window.smx);
