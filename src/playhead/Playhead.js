(function(global, _, Backbone, smx){


/**
* SMX Playhead class
* @memberof smx
*/
class Playhead{

	/**
	 * Create a playhead
	 * @param {SMXDocument} document - The document to navigate through
	 */
	constructor(doc){
    
		//document is required
		if(!doc) return;
    
		//extend with events on, off, trigger
		_.extend(this, Backbone.Events);
    
		/**
		 * The document to navigate through
		 * @type {SMXDocument}
		 * @private
		 */
		this._document = doc;
		
		/**
		 * Contains all currently active nodes.
		 * List ordered from outter to inner [root, ..., currentnode]
		 * @type {SMXNode[]}
		 * @private
		 */
		this._path = [];
    
		/**
		 * List of nodes entered in last movement
		 * @type {SMXNode[]}
		 * @private
		 */
		this._entered = [];
    
		/**
		 * List of nodes exited in last movement
		 * @type {SMXNode[]}
		 * @private
		 */
		this._exited = [];
	
	}


	/**
	 * Gets the associated document
	 * @type {SMXDocument}
	 * @readonly
	 */
	get document(){
		return this._document;
	}


	/**
	 * Gets all currently active nodes.
	 * List ordered from outter to inner [root, ..., currentnode]
	 * @type {SMXNode}
	 * @readonly
	 */
	get path() {
		return this._path;
	}

	/**
	 * Gets the last node in the path which is the head
	 * @type {SMXNode}
	 * @readonly
	 */
	get head(){
		return this._path[this._path.length - 1];
	}

	/**
	 * Gets the first node in the path which is the root
	 * @type {SMXNode}
	 * @readonly
	 */
	get root(){
		return this._path[0];
	}


	/**
	 * Performs play action
	 * @param {(String|SMXNode)=} ref target reference
	 */
	play(ref){
    
		//no reference? just do forward
		if(!ref)	return this.forward();
		
		//resolve target node
		var tnode = (ref.id)? ref : this.document.getNodeById(ref);
    
    //not found? ignore...
    if(tnode) return this.navigate(tnode,{});
    
    //else ignore
    return;
    
	}

	/**
	 * Navigates to head's next node.
	 */
	next(){
		
		//get current node
		var cnode = this.head; if(!cnode) return;

		//get next node
		var tnode = cnode.next; if (!tnode) return;
		
		//go to next node using known swap type
		return this.navigate(tnode,{'type':'next'});
		
	}

	/**
	 * Navigates to head's previous node.
	 */
	previous(){
		
		//get current node
		var cnode = this.head; if(!cnode) return;
    
		//get previous node
		var tnode = cnode.previous; if (!tnode) return;
    
		//go to previous node using known swap type and passing recived params
		return this.navigate(tnode,{'type':'previous'});
		
	}
	
	/**
	 * Navigates inside head's node.
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
    
		//go to child node using known swap type and passing recived params
		return this.navigate(tnode,{ 'type':'inside' });
		
	}

	/**
	 * Navigates outside head's node.
	 */
	exit(){
		
		//get current node
		var cnode = this.head; if(!cnode) return;
    
		//has parent node?
		if(!cnode.parent) return;
    
		//get parent node
		var tnode = cnode.parent;
    
		//go to child node using known swap type and passing recived params
		return this.navigate(tnode,{ 'type':'outside' });
		
	}

	/**
	 * Navigates up to root node.
	 */
	reset(){
		return this.navigate(this.document.root);
	}
	

	/**
	 * Navigates to head's next node in flat tree mode.
	 */
	forward(){
		
		let tnode, cnode, children;
		
		//get current node
		cnode = this.head;
		
		//no current node? ignore
		if(!cnode) return;
    
		tnode = cnode.next;
    
		if(!tnode){
      
			var parent = cnode.parent;
			while(parent && !tnode){
				tnode = parent.next;
				parent = parent.parent;
			}
      
		}
    
		return this.navigate(tnode);
    
	}

	/**
	 * Navigates to head's previous node in flat tree mode.
	 */
	backward(){
		
		var tnode;
		
		if(!this.head) return;
		
		if(this.head.previous)
      tnode = this.head.previous;
    
    else if(this.head.parent)
      tnode = this.head.parent
    
		return this.navigate(tnode);
    
	}

	/**
	 * Executes a playhead action by keyword.
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
	 * Navigates to given node using optional configuration.
	 */
	navigate(ref, opt){

		//check for a keyword, must be '!' preffixed string
		var isKeyword = (typeof ref === 'string' && ref.indexOf('!') === 0);
		
		//keyword? resolve by exec unpreffixed reference
		if(isKeyword)
      return this.exec(ref.substr(1));
    
		//resolve target node by reference
		//assuming having and id property means SMXNode...
		var tnode = (ref.id)? ref : this.document.getNodeById(ref);
    
    //no target found? error!
		if(!tnode)
		  throw new Error('Playhead Error: Invalid target '+ ref);
		
		//get current node
		var cnode = this.head;
		
		//no need to move...
		if(tnode === cnode) return cnode;
		
    //--> ASYNC ATTR CONDITIONAL NAVIGATION WAS HERE...
    //see leagacy playhead implementations for more info
    
    //resets private navigation registry
		this._entered = []; this._exited = [];
    
    
    if(!cnode){
      cnode = this.document.root;
      this._entered.push(cnode);
    }
		
		/* trying a better approach */
		
		var isDescendant = cnode.isAncestorOf(tnode);
		var isAncestor = tnode.isAncestorOf(cnode);
		
		var isNodeOrAncestorOf = function(n){
		  return (n==tnode || n.isAncestorOf(tnode));
		}
		
		var r = cnode;
		if(cnode === tnode){
		  //..
		}
		else if(isDescendant){
		  while(r!=tnode){
		    r = r.children.filter(isNodeOrAncestorOf)[0]
		    this._entered.push(r);
		  }
		}
		else if(isAncestor){
		  while(r!=tnode){
		    this._exited.push(r);
		    r = r.parent;
		  }
		}
		else{
		  while(!r.isAncestorOf(cnode) && !r.isAncestorOf(tnode)){
		    this._exited.push(r);
		    r = r.parent;
		  }
		  while(r!=tnode){
		    r = r.children.filter(isNodeOrAncestorOf)[0]
		    this._entered.push(r);
		  }
		}
		
		
		//update path
		for(var i=0; i<this._exited.length; i++){
		  this._path.pop();
		}
		for(var i=0; i<this._entered.length; i++){
		  this._path.push(this._entered[i]);
		}


    this.trigger('change',{
      activated: this._entered,
      deactivated: this._exited,
      path: this._path,
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
    
		//--> NOSTOP ATTRIBUTE CONDITIONAL NAVIGATION WAS HERE...
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


		
	/**
	 * Enters in given node
	 * @private
	 * @param {SMXNode} node
	 * @fires enter
	 * @fires enter:id
	_enterNode(node){

		//prevents re-entering on node
		var selectedIds = this._path.map(()=>{return n.id});
		if(selectedIds.indexOf(node.id)>=0) return;

		//update selection array
		this._path.push(node);

		//update last move registry
		this._entered.push(node);

		//fire generic 'enter' event
		this.trigger('enter', node);

		//fire specific node 'enter' event
		this.trigger('enter:'+node.id, node);

		return;
	}
	 */

	/**
	 * Exits from current head node
	 * @private
	 * @param {SMXNode} node
	 * @fires exit
	 * @fires exit:id
	_exitNode(){
    
		//update blocks array
		var node = this._path.pop();
    
		//update last move registry
		this._exited.push(node);
    
		//fire generic 'exit' event
		this.trigger('exit', node);
    
		//fire specific node 'exit' event
		this.trigger('exit:'+node.id, node);
    
		return;
    
	}
	 */

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

}



//expose to global
smx.Playhead = Playhead;


})(window, window._, window.Backbone, window.smx);
