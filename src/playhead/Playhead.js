import Eventify from 'eventify';


/**
 * @memberof smx
 * @desc
 * The Playhead class is a {@link smx.Document Document} navigation controller.
 *
 * Provides a plain interface to navigate along a Document tree,
 * keeps a navigation registry and emits useful events for listening
 * to any movement.
 */
class Playhead{

	/**
	 * @param {smx.Document} document - The document to navigate through
	 */
	constructor(doc){
    
		//document is required
		if(!doc) return;
    
		//extend with events on, off, trigger
		Eventify.enable(this);
    
		/**
		 * The document to navigate through
		 * @type {smx.Document}
		 * @private
		 */
		this._document = doc;
		
		/**
		 * Contains all currently selected nodes ordered from outter to inner.
		 * @type {smx.Node[]}
		 * @private
		 */
		this._selection = [];

	}


	/**
	 * Gets the associated document
	 * @type {smx.Document}
	 * @readonly
	 */
	get document(){
		return this._document;
	}


	/**
	 * Gets all currently selected nodes ordered from outter to inner.
	 * @type {smx.Node[]}
	 * @readonly
	 */
	get selection() {
		return this._selection;
	}

	/**
	 * Gets the head node, which is the last node in selection.
	 * @type {smx.Node}
	 * @readonly
	 */
	get head(){
		return this._selection[this._selection.length - 1];
	}

	/**
	 * Gets the root node, which is the first node selection.
	 * @type {smx.Node}
	 * @readonly
	 */
	get root(){
		return this._selection[0];
	}

	/**
	 * Navigates to document's root node.
	 */
  reset() {
    return this.navigate(this.document.root);
  }

	/**
	 * Performs play action
	 * @param {(String|smx.Node)=} ref target reference
	 */
	play(ref){
    
		//no reference? just do a forward
		if(!ref) return this.forward();
		
		//resolve target node
		var tnode = (ref.id)? ref : this.document.getNodeById(ref);
    
		//not found? ignore...
		if(tnode) return this.navigate(tnode);
		
		//else ignore
		return;
    
  }
  
  /**
   * Navigates to an inner node, moves the head to current head's first child.
   */
  enter(){
    
    //get current node
    var cnode = this.head; if(!cnode) return;
    
    //get children nodes
    let children = cnode.children;
    
    //no children?
    if (!children.length) return;
    
    //get first child
    var tnode = children[0];
    
    //navigates to target node
		return this.navigate(tnode);
    
  }

  /**
   * Navigates to an outter node, moves the head to current head's parent.
   */
  exit(){
    
    //get current node
    var cnode = this.head; if(!cnode) return;
    
    //has parent node?
    if(!cnode.parent) return;
    
    //get parent node
    var tnode = cnode.parent;
    
    //navigates to target node
		return this.navigate(tnode);
    
  }

	/**
	 * Navigates to current head's next sibling node.
	 */
  next(){
		
		//get current node
		var cnode = this.head; if(!cnode) return;

		//get next node
		var tnode = cnode.next; if (!tnode) return;
		
    //navigates to target node
		return this.navigate(tnode);
	}

	/**
	 * Navigates to current head's previous sibling node.
	 */
	previous(){
		
		//get current node
		var cnode = this.head; if(!cnode) return;
    
		//get previous node
		var tnode = cnode.previous; if (!tnode) return;
    
    //navigates to target node
		return this.navigate(tnode);
		
	}
	
	/**
	 * Navigates to current head's next node in flat tree mode.
	 */
	forward(){
		
		let tnode, cnode, children;
		
		//get current node
		cnode = this.head;
		
		//no current node? ignore
		if(!cnode) return;
    
		tnode = cnode.first || cnode.next;
    
		if(!tnode){
      
			var parent = cnode.parent;
			while(parent && !tnode){
				tnode = parent.next;
				parent = parent.parent;
			}
      
    }
    
    return (tnode)? this.navigate(tnode) : null;
    
	}
  
	/**
   * Navigates to current head's previous node in flat tree mode.
	 */
  backward(){
    
		if(!this.head) return;
    var tnode = this.head.previous || this.head.parent;
    return (tnode)? this.navigate(tnode) : null;
    
	}

	/**
   * @param {String} keyword
   * @desc
	 * Executes a playhead command based on the given action keyword. keywords
	 * are basically some playhead's method names.
	 *
	 * List of valid commands:
	 * `reset`, `play`, `next`, `previous`,
	 * `enter`, `exit`, `forward`, `backward`.
	 *
	 */
	exec(keyword){
    	  
		//define valid keywords mapping existing methods
		var keywords = [
		  'reset', 'play', 'next', 'previous',
		  'enter', 'exit', 'forward', 'backward'
		];
    
    //resolve for a valid keyword
    var isValidKeyword = (keywords.indexOf(keyword)>=0);
    
    //not valid keyword? error!
		if(!isValidKeyword)
		  throw new Error( 'UNKNOWN KEYWORD "!"'+ keyword +'"' );
    
    //try-catched execution
		try{ return this[keyword]()	}
		catch(e){	throw new Error( 'Playhead Error: Keyword exec "!'+ keyword +'"', e) }
    
	}

	/**
   * @param {String|smx.Node} target
   * @desc
   *
	 * Navigates to a given target node or executes a playhead command.
	 * If `target` is a node will navigate to it, if `target` is a string will
	 * try to find a node identified as `target` and will navigate to it. If
	 * `target` is a `!` preffixed string will execute it as a playhead command.
	 *
	 * See {@link smx.Playhead#exec .exec()} for a list of valid commands.
	 *
	 * @example
	 * //instance a new Playhead
	 * var playhead = new smx.Playhead(doc);
	 *
	 * //navigate by node identifier
	 * playhead.navigate('a42');
	 *
	 * //to to given node
	 * playhead.navigate(node);
	 *
	 * //using commands
	 * playhead.navigate('!next')
	 * //same as
	 * playhead.exec('next')
	 * // or
	 * playhead.next();
	 *
	 */
  navigate(target){

		//check for a keyword, must be '!' preffixed string
    var isKeyword = (typeof target === 'string' && target.indexOf('!') === 0);
		
		//keyword? resolve by exec unpreffixed reference
		if(isKeyword)
      return this.exec(target.substr(1));
    
		//resolve target node by reference
		//assuming having and id property means smx.Node...
    var tnode = (target.id) ? target : this.document.getNodeById(target);
    
    //no target found? error!
		if(!tnode)
      throw new Error('Playhead Error: Invalid target ' + target);
		
		//get current node
		var cnode = this.head;
		
		//no need to move...
		if(tnode === cnode) return cnode;
		
    //--> LEGACY ASYNC ATTR CONDITIONAL NAVIGATION WAS HERE...
    //see leagacy playhead implementations for more info
    
    //resets private navigation registry
		var selected = [], deselected = [];
    
    
    if(!cnode){
      cnode = this.document.root;
      selected.push(cnode);
    }
		
		/* trying a better approach */
		
		var isDescendant = cnode.isAncestorOf(tnode);
		var isAncestor = tnode.isAncestorOf(cnode);
    
    //aux filter fn for later use
		var isNodeOrAncestorOf = (n) => (n==tnode || n.isAncestorOf(tnode));
		
		var r = cnode;
		if(cnode === tnode){
		  //..
		}
		else if(isDescendant){
		  while(r!=tnode){
		    r = r.children.filter(isNodeOrAncestorOf)[0];
		    selected.push(r);
		  }
		}
		else if(isAncestor){
		  while(r!=tnode){
		    deselected.push(r);
		    r = r.parent;
		  }
		}
		else{
		  while(!r.isAncestorOf(cnode) || !r.isAncestorOf(tnode)){
		    deselected.push(r);
		    r = r.parent;
		  }
		  while(r!=tnode){
		    r = r.children.filter(isNodeOrAncestorOf)[0]
		    selected.push(r);
		  }
		}
		
		
		//update path
		for(var i=0; i<deselected.length; i++){
		  this._selection.pop();
		}
		for(var i=0; i<selected.length; i++){
		  this._selection.push(selected[i]);
		}


    this.trigger('change',{
      selected: selected,
      deselected: deselected,
      selection: this._selection,
      origin: cnode,
      target: tnode
    });
    
		/*
		//FIRE EVENTS
    
		//FIRE 'LEAVE' EVENT
		if(cnode){
      
			//fire generic 'leave' event in resulting current node
			this.trigger('leave', cnode);
			
			//fire specific node 'leave' event
			this.trigger('leave:'+cnode.id, cnode);
			
		}
    
		//--> LEGACY CONDITIONAL NOSTOP ATTRIBUTE WAS HERE...
    //see leagacy playhead implementations for more info
    
		//fire generic 'stay' event in resulting current node
		this.trigger('stay',tnode);
		
		//fire specific node 'stay' event
		this.trigger('stay:'+tnode.id,tnode);
    
		//notify node navigation completed
		this.trigger('ready',tnode);
    
    //return head node
		return this.head;
		
		*/
		
	}
	


}

//Doclets for Eventify extended methods

/**
 * Binds an event to a `callback` function. Passing `"all"` will bind
 * the callback to all events fired.
 * @memberof smx.Playhead
 * @instance
 * @method
 * @name on
 * @param {String} name
 * @param {Function} callback
 * @param {Object} context
 */

/**
 * Binds an event to only be triggered a single time. After the first time
 * the callback is invoked, it will be removed.
 * @memberof smx.Playhead
 * @instance
 * @method
 * @name once
 * @param {String} name
 * @param {Function} callback
 * @param {Object} context
 */

/**
 * Remove one or many callbacks. If `context` is null, removes all
 * callbacks with that function. If `callback` is null, removes all
 * callbacks for the event. If `name` is null, removes all bound
 * callbacks for all events.
 * @memberof smx.Playhead
 * @instance
 * @method
 * @name off
 * @param {String} name
 * @param {Function} callback
 * @param {Object} context
 */


//Doclet for PlayheadEvent definition
/**
 * Playhead Event Object
 * @typedef {Object} smx.Playhead.PlayheadEvent
 * @property {smx.Node[]} selected
 * @property {smx.Node[]} deselected
 * @property {smx.Node[]} selection
 * @property {smx.Node} origin
 * @property {smx.Node} target
 */


//Doclets for events

/*
 * Fired every time the head changes.
 * @event change
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired when entering to any node
 * @event enter
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired just after `enter` but for a specific node
 * @event enter:id
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired when exiting from any node
 * @event exit
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired just after `exit` but for a specific node
 * @event exit:id
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired every time a head change occurs and stays on any node
 * @event stay
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired just after `stay` but for a specific node
 * @event stay:id
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired every time a node stops being the head
 * @event leave
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired just after `leave` but for a specific node
 * @event leave:id
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired every time the playhead finishes all operations and goes idle
 * @event ready
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

/*
 * Fired when playhed goes to sync mode
 * @event sync
 * @memberof smx.Playhead
 * @return {smx.Playhead.PlayheadEvent}
 */

export default Playhead;