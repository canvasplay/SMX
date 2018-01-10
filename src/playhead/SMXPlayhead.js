(function(global, _, Backbone, smx){


/**
*	SMXDocument Navigation controller class
*
*/

class SMXPlayhead{

  /**
   * Create a playhead
   * @param {SMXDocument} document - The document to navigate through
   */
  constructor(doc){
    
		//document argument is required!
		if(!doc) return;

		//extend with events on, off, trigger
		_.extend(this, Backbone.Events);


		/**
		*	@property document
		*	@type {SMXDocument}
		*	The document to navigate
		*/
		this.document = doc;
		

		/**
		*	@property selection
		*	@type {Array}
		*	Contains all nodes in which playhead has entered
		*	List ordered from outter to inner [root, ..., current_node]
		*/
		this.selection = [];


		//selected timeline
		this.timeline = null;


		//private last movement log
		this._entered = [];
		this._exited = [];
	
	
  }




	/**
	*	@method get
	*	@param [key] {string} attribute name
	*	@return attribute value
	*
	*/
	get(key){
	  
	  let result;
	  
		switch(key){
			case 'selected':
				result = this.selection;
			break;
			case 'head':
				result = this.selection[this.selection.length-1];
			break;
			case 'root':
				result = this.selection[0];
			break;
			case 'entered':
				result = this._entered;
			break;
			case 'exited':
				result = this._exited;
			break;
			default:
			break;

		}
		
		return result;
		
	}


	/* PUBLIC METHODS */

	/**
	*	@method play
	*	@param [id] {string} id of target node
	*
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
		var first = cnode.first(); if(first) cnode = first;

		if (!cnode.isAccesible()) return;

		return this.go(cnode,options);

	}

	/**
	*	@method pause
	*
	*/
	pause(){

		//call timeline pause
		if(this.timeline) this.timeline.pause();
		
		return;
	}

	/**
	*	@method toggle
	*
	*/
	toggle(){

		//call timeline toggle
		if(this.timeline) this.timeline.toggle();

		return;

	}

	/**
	*	@method next
	*
	*/
	next(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//get next node
		var tnode = cnode.next(); if (!tnode) return;
		
		//check for accesibility
		if(!tnode.isAccesible()) return;

		//go to previous node using known swap type and passing recived params
		return this.go(tnode,{'swap_type':'next'});
		
	}

	/**
	*	@method previous
	*
	*/
	previous(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//get previous node
		var tnode = cnode.previous(); if (!tnode) return;

		//check for accesibility
		if (!tnode.isAccesible()) return;

		//go to previous node using known swap type and passing recived params
		return this.go(tnode,{'swap_type':'previous'});
		
	}
	
	/**
	*	@method inside
	*
	*/
	inside(){
	
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//inside navigation is only allowed above nodes without timeline
		if (cnode.timeline) return;

    //get children nodes
    let children = cnode.children();
    
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
	*	@method outside
	*
	*/
	outside(){
		
		//get current node
		var cnode = this.get('head'); if(!cnode) return;

		//has parent node?
		if(!cnode.hasParent()) return;

		//get parent node
		var tnode = cnode.parent();

		//go to child node using known swap type and passing recived params
		return this.go(tnode,{ 'swap_type':'outside' });
		
	}

	/**
	*	@method outside
	*
	*/
		
	root(){
		
		//get root node
		var root_node = this.get('root');

		//root node is required!
		if(!root_node) return;

		//go to root node
		return this.go(root_node);
		
	}
	

	/**
	* @method forward
	* @description Go to next node in flat tree mode
	*
	*/
	forward(){
		
		let tnode, cnode, children;
		
		//get current node
		cnode = this.get('head');
		
		//no current node? ignore
		if(!cnode) return;

		if(!cnode.time('timeline') && !cnode.time('timed')){
		  
			children = cnode.children();
			
			if(!children.length)
				tnode = cnode.next();
			else
				tnode = cnode.first();
			
		}
		else{
			tnode = cnode.next();
		}


		if(!tnode){

			var parent = cnode.parent();
			while(parent && !tnode){
				tnode = parent.next();
				parent = parent.parent();
			}

		}

		
		if (!tnode.isAccesible()) return;
		return this.go(tnode);

	}

	/**
	* @method rewind
	* @description Go to previous node in flat tree mode
	*
	*/
	rewind(){
		
		let cnode = this.get('head'); if(!cnode) return;
		let tnode = cnode.stepBack(); if (!tnode) return;
		
		if (!tnode.isAccesible()) return;
		return this.go(tnode);

	}

	/**
	*	@method go
	*   @description Go to given node
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
			if (_.includes(keywords,keyword)){
				
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
		var t_node = (_.isString(ref))? this.document.getNodeById(ref) : ref;

		// GET CURRENT NODE
		var c_node = this.get('head');
			
		//NODE NOT FOUND
		if (!t_node)
		  throw new Error('NODE WAS NOT FOUND');
		
		//TARGET NODE == CURRENT NODE ?
		//if (c_node) if (c_node.id == t_node.id) throw new Error('201');
		if (c_node == t_node) return c_node;

		//IS TARGET NODE INSIDE TIMELINE?
		//playhead cannot access nodes inside a timeline
		if (t_node.time('timed'))
			throw new Error('NODE "'+ t_node.id +'" IS NOT VISITABLE');

		//IS TARGET NODE ACCESIBLE ?
		if (!t_node.isAccesible() && !global.app.config.FREE_ACCESS)
			throw new Error('NODE "'+ c_node.id +'" IS NOT ACCESIBLE');

		
		

		/**

		HERE YOU CAN PLUG ASYNC NAVIGATION CONTROLLERS... like SCORMX or VMSCO or...

		*/

		try{
	
			var async = this.requestAsyncNodeAccess(t_node);

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
		if (t_node.autoplay===true && t_node.children().length>0){
			return this.go(t_node.cnode.getFirstChild(),options);
		}





		//We are going to check for multiple node swaping posibilities.
		//Being selective should be faster than using the iterative method.
		
		//if swap_type parameter was not defined tries to autodetect direct values
		if (!options.swap_type){
		
			if (!c_node) 						options.swap_type = 'from_root';
			else if(c_node.isParentOf(t_node))	options.swap_type = 'child';
			else if(t_node.isParentOf(c_node))	options.swap_type = 'parent';
			else{

				if(c_node.hasParent()){
					var current_parent_node = c_node.parent();
					var target_parent_node = t_node.parent();
					if (current_parent_node.id == target_parent_node.id){
						options.swap_type = 'sibling';
					}
				}
				
			}
		
		}
		
		
		//Do all necesary 'enter' and 'exit' calls for node navigation
		switch(options.swap_type){
		
			case 'outside':
				//exit from current
				this._exitNode(c_node);
				//we are already inside t_node because t_node is first parent of c_node
				//but re-enter for trigger 'enter' event
				this._enterNode(t_node);
			break;
			case 'inside':
				//enter in child node
				this._enterNode(t_node);
			break;
			case 'next':
			case 'previous':
			case 'sibling':
				//exit from current
				this._exitNode(c_node);
				//enter in sibling node
				this._enterNode(t_node);
			break;
			case 'from_root':
				//enter all nodes from root to t_node
				this._enterStraight(null,t_node);
			break;
			case 'child':
				//enter all nodes c_node to t_node
				this._enterStraight(c_node,t_node);
			break;
			case 'parent':
			
				//navigate parents from c_node until reach t_node
				let ref_node = c_node;
				let t_node_found = false;
				while (ref_node.hasParent() && !t_node_found){
					//exit from ref_node
					this._exitNode(ref_node);
					//update ref_node
					ref_node = ref_node.parent();
					//t_node found?
					if (ref_node.id == t_node.id) t_node_found = true;
				}
				
				//we are already inside t_node because t_node is parent of c_node
				//but re-enter for trigger 'enter' event
				this._enterNode(t_node);
				
			break;
			default:
				//iterative method
				this._goIterative(c_node,t_node);
			break;
		}
		


		//TIMELINE?

		//create timeline, will only be created if its possible and if its needed
		if(t_node.time('timeline')) this._createTimeline();


		//FIRE EVENTS

		//FIRE 'LEAVE' EVENT
		if (c_node){
			//fire generic 'leave' event in resulting current node
			this.trigger('leave',c_node);
			//fire specific node 'leave' event
			this.trigger('leave:'+c_node.id,c_node);
		}



		/* NOSTOP ATTRIBUTE WARNING VERY EXPERIMENTAL CODE BELOW */

		// node having the 'nostop' attribute prevents the playhead to stop on it
		var nostop = t_node.has('nostop');

		if (nostop && t_node.id != this.get('root').id){

			var entered = this.get('entered');
			var exited = this.get('exited');

			if (entered.length>0){
				if( entered[entered.length-1].id == t_node.id){

					if (t_node.children().length>0){
						return this.inside();
					}
					else{
						if(t_node.hasParent()){
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

				if( exited[0].isChildOf(t_node) ){
					if(t_node.hasParent()){
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
			this.trigger('stay',t_node);
			//fire specific node 'stay' event
			this.trigger('stay:'+t_node.id,t_node);

			//FIRE 'READY' EVENT
			//notify node navigation completed
			this.trigger('ready',t_node);



			//return resultant current node
			return this.get('head');


		}

		
		
	}





	/* PRIVATE METHODS */



	/**
	 *  private methods
	 *
	 */



	_goIterative(c_node,t_node){
	
		//ok! we are going to navigate from c_node(current node) to t_node(target node). Lets go!
		
		//navigate from root
		if(!c_node)
			this._enterStraight(null,t_node);
	
		else{
		//navigate from current node
		
			//looks parents for a common parent between current and target node
			let ref_node = c_node;
			let common_parent = null;
			while (ref_node && ref_node.hasParent() && !common_parent){

				//exit nodes at same that searches
				this._exitNode(ref_node);

				ref_node = ref_node.parent();
				if (ref_node.isParentOf(t_node)) common_parent = ref_node;
			}
			
			//was common parent found?
			if (common_parent){
				this._enterStraight(common_parent,t_node);
			}
			else{
				this._enterStraight(null, t_node);
			}

		}
		
		
	}
	
	_enterStraight(parent_node,child_node){
	
		//Performs iterative 'enter' method on child nodes from parent_node to a known child_node

		//check if child_node is not child of parent_node
		if( parent_node && !parent_node.isParentOf(child_node) ) return;
		
		//creates a parent nodes array from child node
		var child_node_parents = [];
		
		//looks parents and fills the array until reach known parent_node
		var ref_node = child_node;
		var parent_node_reached = false;
		while (ref_node && ref_node.hasParent() && !parent_node_reached){
			ref_node = ref_node.parent();
			if(parent_node) if(ref_node.id == parent_node.id) parent_node_reached = true;

			if(ref_node && !parent_node_reached) child_node_parents.unshift(ref_node);
		}
		
		//call 'enter' method in each parent node
		for (var p=0; p<child_node_parents.length; p++){
			this._enterNode(child_node_parents[p]);
		}
		
		//call 'enter' method in child node
		this._enterNode(child_node);
	
	}
	
	

	_enterNode(_node){

		//prevent re-enter in a node
		var selectedIds = _.map(this.selection,'id');
		if(_.includes(selectedIds,_node.id)) return;

		//update selection array
		this.selection.push(_node);

		//update last move registry
		this._entered.push(_node);

		//fire generic 'enter' event
		this.trigger('enter', _node);

		//fire specific node 'enter' event
		this.trigger('enter:'+_node.id, _node);

		return;
	}


	_exitNode(_node){

		//clear timeline
		if(this.timeline) this._destroyTimeline();

		//update blocks array
		this.selection.pop();

		//update last move registry
		this._exited.push(_node);

		//fire generic 'exit' event
		this.trigger('exit', _node);

		//fire specific node 'exit' event
		this.trigger('exit:'+_node.id, _node);

		return;

	}



	/**
	 *	PRIVATE TIMELINE MANAGING
	 *
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
	 *	TIMELINE EVENT HANDLERS
	 *	These methods just propagate the timeline events as nested playhead events
	 *	Useful for listening to timeline events even when timeline does not exists
	 *	Also useful for having a centralized playhead activity
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


	_onTimelinePlay(event){
		this.trigger('timeline:play', event); return;
	}

	_onTimelinePause(event){
		this.trigger('timeline:pause', event); return;
	}

	_onTimelineUpdate(event){
		this.trigger('timeline:update', event);	return;
	}

	_onTimelineSeek(event){
		this.trigger('timeline:seek', event); return;
	}

	_onTimelineFinish(event){
		this.trigger('timeline:finish', event); return;
	}

	_onTimelineReset(event){
		this.trigger('timeline:reset', event); return;
	}

	_onTimelineEnter(event){
		this.trigger('timeline:enter', event); return;
	}

	_onTimelineExit(event){
		this.trigger('timeline:exit', event); return;
	}

  requestAsyncNodeAccess(node){
  	
  	return false;
  
  }


}






//expose to global
smx.Playhead = SMXPlayhead;


})(window, window._, window.Backbone, window.smx);
