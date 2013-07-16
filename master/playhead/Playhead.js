/**
* SMX PlayHead Controller
*
* @class Playhead
*/


/*

	!enter
	!exit
	!ready

	!start
	!finish
	!play
	!pause
	!seek

	!timeline:update
	!timeline:play
	!timeline:pause
	

 *
 *
 */

(function(smx){

	var SMXPlayhead = function(doc){

		//document argument is required!
		if(!doc) return;

		//extend with events
		_.extend(this, Backbone.Events);

		//SMX Document to use as document data soucre
		this.document = doc;
		
		//selection (Array), contains all nodes in which playhead has entered in
		this.selection = [];

		//selected timeline
		this.timeline = null;


		//private last movement log
		var _entered = [];
		var _exited = [];


		/**
		*	@method get
		*	@param [key] {string} attribute name
		*	@return attribute value
		*
		*/
		this.get = function(key){
			switch(key){
				case 'head':
					return this.selection[this.selection.length-1];
				break;
				case 'root':
					return this.selection[0];
				break;
				case 'entered':
					return _entered;
				break;					
				case 'exited':
					return _exited;
				break;
				default:
					return;
				break;

			}
		}


		/* PUBLIC METHODS */

		/**
		*	@method play
		*	@param [id] {string} id of target node
		*
		*/

		this.play = function(id){

			var cnode = null;
			var options = { 'auto':true };

			//get target node
			if (!id)	cnode = this.get('head');
			else		cnode = this.document.getNodeById(id);

	 		if(!cnode) return;

	 		//check for node accesibility
			if (!cnode.isAccesible()) return;

			//if current node has timeline return node play result
			if( cnode.timeline && this.timeline ) return this.timeline.play();

			//if has childs get firstchild
			//else get next node in the global timeline
			var first = cnode.first(); if(first) cnode = first;

			if (!cnode.isAccesible()) return;

			return this.go(cnode,options);

		};

		/**
		*	@method pause
		*	@param [auto] {boolean} id of target node
		*
		*/
		this.pause= function(auto){

			//get current node
			if(!this.timeline) return;

			//call pause
			this.timeline.pause();
			
			return;
		};

		/**
		*	@method toggle
		*
		*/
		this.toggle= function(auto){

			//node has timeline?
			if(this.timeline) this.timeline.toggle();

			return;

		};

		/**
		*	@method next
		*
		*/
		this.next= function(auto){
			
			//get current node
			var cnode = this.get('head'); if(!cnode) return;

			//get next node
			var tnode = cnode.next(); if (!tnode) return;
			
			//check for accesibility
			if(!tnode.isAccesible()) return;

			//go to previous node using known swap type and passing recived params	
			return this.go(tnode,{'swap_type':'next','auto':auto});
			
		};

		/**
		*	@method previous
		*
		*/		
		this.previous= function(auto){
			
			//get current node
			var cnode = this.get('head'); if(!cnode) return;

			//get previous node
			var tnode = cnode.previous(); if (!tnode) return;

			//check for accesibility
			if (!tnode.isAccesible()) return;

			//go to previous node using known swap type and passing recived params	
			return this.go(tnode,{'swap_type':'previous','auto':auto});
			
		};
		
		/**
		*	@method inside
		*
		*/	
		this.inside= function(auto){
		
			//get current node
			var cnode = this.get('head'); if(!cnode) return;

			//inside navigation is only allowed above nodes without timeline
			if (cnode.timeline) return;

			//has children nodes?
			if (!cnode.children().length>0) return;

			//get first child
			var tnode = cnode.childAt(0);

			//check for accesibility
			if (!tnode.isAccesible()) return;

			//go to child node using known swap type and passing recived params
			return this.go(tnode,{ 'swap_type':'inside', 'auto':auto });
			
		};

		/**
		*	@method outside
		*
		*/	
		this.outside= function(auto){
			
			//get current node
			var cnode = this.get('head'); if(!cnode) return;

			//has parent node?
			if(!cnode.hasParent()) return;

			//get parent node
			var tnode = cnode.parent();

			//go to child node using known swap type and passing recived params
			return this.go(tnode,{
				'swap_type':'outside',
				'auto':auto
			});
			
		};

		/**
		*	@method outside
		*
		*/	
		this.root= function(auto){
			
			//get root node
			var root_node = this.get('root');

			//root node is required!
			if(!root_node) return;

			//go to root node
			return this.go(root_node,{ 'auto':auto });
			
		};

		/**
		*	@method forward
		*   @description Go to next node in flat tree
		*/			
		this.forward= function(auto){
			
			var cnode = this.get('head'); if(!cnode) return;
			var tnode = cnode.stepForward(); if (!tnode) return;
			
			if (!tnode.isAccesible()) return;
			return this.go(tnode,{'auto':auto});

		};

		/**
		*	@method rewind
		*   @description Go to previous node in flat tree
		*/			
		this.rewind= function(auto){
			
			var cnode = this.get('head'); if(!cnode) return;
			var tnode = cnode.stepBack(); if (!tnode) return;
			
			if (!tnode.isAccesible()) return;
			return this.go(tnode,{'auto':auto});

		};

		/**
		*	@method go
		*   @description Go to given node
		*/	
		this.go = function(_node, opt){

			//normalize given node, node can be string id or node
			var t_node = (_.isString(_node))? this.document.getNodeById(_node) : _node;

			// GET CURRENT NODE
			var c_node = this.get('head');
				
			//NODE NOT FOUND ?
			if (!t_node) throw new Error('200');

			//TARGET NODE == CURRENT NODE ?
			//if (c_node) if (c_node.id == t_node.id) throw new Error('201');
			if (c_node == t_node) return c_node;

			//TARGET NODE DISPLAY ALLOWED ?
			if (!t_node.isAccesible()){

				var hash = '#/'+ c_node.get('uri');
				window.location = hash;

				throw new Error('202');
			}



			//INITIALIZE OPTIONS
			var options = {	'auto': false, 'swap_type': null };
			if (opt){ options = { 'auto': opt.auto || false, 'swap_type': opt.swap_type || null } };

			
			
			/*
			//CONDITIONAL NAVIGATION FLAGS
			//AUTO MODE: SKIP REDIRECT?
			if (options.auto==true){

				var s_node = this._getAutoSkipRedirect(t_node);
				if (s_node){
					return this.go(s_node,options);
				}
			}
			*/


			/*
			//OPTIONS.AUTO ?
			if (options.auto==true){

				var s_node = this._getFirstNotCompletedNode(t_node);
				if (s_node){
					options.auto = false;
					return this.go(s_node,options);
				}
			}
			*/



			//RESET PRIVATE MOVE LOG
			_entered = []; _exited = [];



			//if 'autoplay' behavior is enabled call 
			if (t_node.autoplay==true && t_node.children().length>0){
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
					_exitNode(c_node);
					//we are already inside t_node because t_node is first parent of c_node
					//but re-enter for trigger 'enter' event 
					_enterNode(t_node);
				break;
				case 'inside':
					//enter in child node
					_enterNode(t_node);
				break;
				case 'next':
				case 'previous':
				case 'sibling':
					//exit from current
					_exitNode(c_node);
					//enter in sibling node
					_enterNode(t_node);
				break;
				case 'from_root':
					//enter all nodes from root to t_node
					_enterStraight(null,t_node);
				break;
				case 'child':
					//enter all nodes c_node to t_node
					_enterStraight(c_node,t_node);
				break;
				case 'parent':
				
					//navigate parents from c_node until reach t_node
					var ref_node = c_node;
					var t_node_found = false;
					while (ref_node.hasParent() && !t_node_found){
						//exit from ref_node
						_exitNode(ref_node);
						//update ref_node
						ref_node = ref_node.parent();
						//t_node found?
						if (ref_node.id == t_node.id) t_node_found = true;
					}
					
					//we are already inside t_node because t_node is parent of c_node
					//but re-enter for trigger 'enter' event 
					_enterNode(t_node);
					
				break;
				default:
					//iterative method
					_goIterative(c_node,t_node);
				break;
			}
			


			//destroy current timeline
			//if(this.timeline) this.destroyTimeline();


			//fire generic 'stay' event in resulting current node
			this.trigger('stay',t_node);

			//fire specific node 'stay' event
			this.trigger('stay:'+t_node.id,t_node);


			//notify node navigation completed
			this.trigger('ready',this);			

			//return resultant current node
			return this.get('head');
			
			
		};
		



		/* PRIVATE METHODS */

		/*

		this._log= function(msg){

			debug.log(msg);

		};

		*/

		/*
		this._getFirstNotCompletedNode= function(node){

			var _getFirstNotCompletedNodeRecursive = function(_node){

				if(!_node) return;

				if (!_node.isTimeline() && _node.children()>0){
					var childnodes = _node.children();
					for (var i=0; i<childnodes.length; i++){
						var child = childnodes[i];
						switch(child.get('step')){
							case 0:
								return child;
							break;
							case 1:
								if (!child.isTimeline()){
									return _getFirstNotCompletedNodeRecursive(child);	
								}
								else{
									return child;
								}
								
							break;
							default:

							break;
						}

					}
					
				}

				return _node;			

			};


			return _getFirstNotCompletedNodeRecursive(node);
		};
		*/


		/*
		this._getAutoSkipRedirect= function(_node){

			if(!_node) return;

			if (_node.autoSkip && _node.autoSkip==true){
			//'autoSkip' behavior is enabled

				this._log('autoSkip');

				if(_node.isTimeline()){

					return _node.getNext();

				}
				else{

					if (_node.hasChilds()){
						return _node.getFirstChild();		
					}
					else if(_node.getNext()){
						return _node.getNext();		
					}

				}

				
			}
			else if (_node.autoSkipIfCompleted && _node.autoSkipIfCompleted==true){

				if(_node.getNext()){
					if (_node.get('tracking')>=2){
						this._log('autoSkipIfCompleted');
						return _node.getNext();
					}
				}
			}

			return;

		};
		*/

		var _this = this;

		var _goIterative= function(c_node,t_node){
		
			//ok! we are gonna navigate from c_node(current node) top t_node(target node). Lets go!
			
			if (!c_node){
			//navigate from root
				
				_enterStraight(null,t_node);
				
			}
			else{
			//navigate from current node
			
				//looks parents for a common parent between current and target node
				var ref_node = c_node;
				var common_parent = null;
				while (ref_node.hasParent() && !common_parent){

					//exit nodes at same that searches
					_exitNode(ref_node);

					ref_node = ref_node.parent();
					if (ref_node.isParentOf(t_node)) common_parent = ref_node;
				}
				
				//was common parent found?
				if (common_parent){
					_enterStraight(common_parent,t_node);
				}
				else{
					_enterStraight(null, t_node);
				}

			}
			
			
		};
		
		var _enterStraight= function(parent_node,child_node){
		
			//Performs iterative 'enter' method on child nodes from parent_node to a known child_node

			//check if child_node is not child of parent_node
			if(parent_node) if(!parent_node.isParentOf(child_node)) return;
			
			//creates a parent nodes array from child node
			var child_node_parents = [];
			
			//looks parents and fills the array until reach known parent_node
			var ref_node = child_node;
			var parent_node_reached = false;
			while (ref_node.hasParent() && !parent_node_reached){
				ref_node = ref_node.parent();
				if(parent_node) if(ref_node.id == parent_node.id) parent_node_reached = true;

				if(!parent_node_reached) child_node_parents.unshift(ref_node);
			}
			
			//call 'enter' method in each parent node
			for (var p=0; p<child_node_parents.length; p++){
				_enterNode(child_node_parents[p]);
			}
			
			//call 'enter' method in child node
			_enterNode(child_node);
		
		};



		/**
		 *  private methods
		 *	  
		 */

		var _enterNode= function(_node){

			//prevent re-enter in a node
			var selectedIds = _.pluck(_this.selection,'id');
			if(_.contains(selectedIds,_node.id)) return;

			//update selection array
			_this.selection.push(_node);

			//update last move registry
			_entered.push(_node);

			//fire generic 'enter' event 
			_this.trigger('enter', _node);

			//fire specific node 'enter' event 
			_this.trigger('enter:'+_node.id, _node);

			return;
		};


		var _exitNode= function(_node){

			//clear timeline
			if(_this.timeline) _this.destroyTimeline();

			//update blocks array
			_this.selection.pop();

			//update last move registry
			_exited.push(_node);

			//fire generic 'exit' event 
			_this.trigger('exit', _node);

			//fire specific node 'exit' event 
			_this.trigger('exit:'+_node.id, _node);

			return;

		};



		/**
		 *	TIMELINE HANDLING
		 *


		this.createTimeline = function(){
		
			var cnode = this.get('head');
			if(!cnode) return;

			//destroy current timeline if needed
			if (this.timeline) this.destroyTimeline();
			
			//create timeline
			this.timeline = new smx.time.Timeline(cnode);
			
			//setup listeners
			this._bindTimelineListeners();

			return;
		};



		this.destroyTimeline = function(){
			
			//remove listeners
			this._unbindTimelineListeners();

			//destroy timeline
			this.timeline.destroy();

			//reset timeline
			this.timeline = null;
			
			return;
		};


		this._bindTimelineListeners= function(){
		
			if (!this.timeline) return;

			this.timeline.on('play', this.onTimelinePlay, this);
			this.timeline.on('pause', this.onTimelinePause, this);
			this.timeline.on('update', this.onTimelineUpdate, this);
			this.timeline.on('seek', this.onTimelineSeek, this);
			this.timeline.on('reset', this.onTimelineReset, this);
			this.timeline.on('enter', this.onTimelineEnter, this);
			this.timeline.on('exit', this.onTimelineExit, this);

			return;
		};
		
		this._unbindTimelineListeners= function(){
		
			if (!this.timeline) return;

			this.timeline.off('play', this.onTimelinePlay, this);
			this.timeline.off('pause', this.onTimelinePause, this);
			this.timeline.off('update', this.onTimelineUpdate, this);
			this.timeline.off('seek', this.onTimelineSeek, this);
			this.timeline.off('reset', this.onTimelineReset, this);
			this.timeline.off('enter', this.onTimelineEnter, this);
			this.timeline.off('exit', this.onTimelineExit, this);
		
			return;
		};

		

		this.onTimelinePlay= function(event){

			this.trigger('timeline:play', event);

			return;
		};

		this.onTimelinePause= function(event){
		
			this.trigger('timeline:pause', event);
			return;
		};

		this.onTimelineUpdate= function(event){
		
			this.trigger('timeline:update', event);
			return;
		};

		this.onTimelineSeek= function(event){
		
			this.trigger('timeline:seek', event);

			return;
		};

		this.onTimelineReset= function(event){
		
			this.trigger('timeline:reset', event);

			return;
		};

		this.onTimelineEnter= function(event){
		
			this.trigger('timeline:enter', event);

			return;
		};

		this.onTimelineExit= function(event){
		
			this.trigger('timeline:exit', event);

			return;
		};

		*/


		return this;

	};



	//expose
	smx.Playhead = SMXPlayhead;


})(window.smx);
