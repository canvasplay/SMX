
/**
 * Document Class
 * 
 */

SMX.document.Document = new JS.Class({

	initialize: function(){
	
		//create cahce for searches
		this.getNodeById.cache = {}; 

		this.meta = new SMX.document.Metadata();
		
		this.nodeName = 'DOCUMENT';
		
		this.preferences = {};
		
		this.content = new SMX.document.Block();
		this.content.nodeName = 'ROOT';
		this.content.meta.title = 'Content';
		
		//navigation index
		this.current_node = null;
		
	
	},
	
	getNodeById: function( _id ){ 
	
	  var found; 
	 
	  if( this.getNodeById.cache[_id] ){ 
	  
		found = this.getNodeById.cache[_id]; 
		
	  }else{ 
	  
		var searchChilds = function(_node,__id){
			var _found=null;
			var _childs = _node.getChildNodes();
			var n=0;
			while (!_found && n < _childs.length){
				if (_childs[n].id==__id) _found = _childs[n];
				else{
					var _result = searchChilds(_childs[n],__id);
					if (_result) _found = _result;
				}
				n++
			}
			
			return _found;
		}
		
		found = searchChilds(this.content,_id);
		
		if (found) this.getNodeById.cache[_id] = found; 
		
	  } 
	 
	  return found; 
	  
	},
	
	goOutside: function(){
		
		this.goToNode(this.current_node.getParentNode(),'outside');
		
	},
	
	goInside: function(){
		
		this.goToNode(this.current_node.getNextNode(),'inside');
		
	},

	goNext: function(){
		
		if (this.current_node.getNextSibling()) this.goToNode(this.current_node.getNextSibling(),'next');
		
	},
	
	goPrevious: function(){
		
		if (this.current_node.getPreviousSibling()) this.goToNode(this.current_node.getPreviousSibling(),'previous');
		
	},
	
	setpForward: function(){
		
		this.goToNode(this.current_node.getNextNode());
		
	},

	goToNode: function(_node, swap_type){
		
		//if (!_node) return;
		//or
		if (!_node) _node = this.content;
		
		//current node
		var c_node = this.current_node;
		
		//target node
		var t_node = _node;
		
		//return; if are the same node.
		//Comparing 'id's is faster than comparing objects :)
		if (c_node) if (c_node.id == t_node.id) return;
		
		
		//We are going to check multiple node swaping posibilities.
		//Being selective should be faster than using the iterative method.
		
		//if swap_type was not specified try to figure out
		if (!swap_type){
		
			if (!c_node){
				swap_type = 'from_root';
			}
			else if(c_node.isParentNode(t_node)){
				swap_type = 'child';
			}
			else if(t_node.isParentNode(c_node)){
				swap_type = 'parent';
			}
			else{
				if(c_node.getParentNode()){
					var current_parent_node = c_node.getParentNode();
					var target_parent_node = t_node.getParentNode();
					if (current_parent_node.id == target_parent_node.id){
						swap_type = 'sibling';
					}
				}
			}
		
		}
		
		
		//Calls all 'enter' and 'exit' calls needed for node swaping.
		switch(swap_type){
		
			case 'outside':
				c_node.exit();
				t_node.enter();
			break;
			case 'inside':
				t_node.enter();
			break;
			case 'next':
			case 'previous':
			case 'sibling':
				c_node.exit();
				t_node.enter();
			break;
			case 'from_root':
				this.enterStraight(null,t_node);
			break;
			case 'child':
				this.enterStraight(c_node,t_node);
			break;
			case 'parent':
			
				//iterate trough parents
				var ref_node = c_node;
				var t_node_found = false;
				while (ref_node.hasParentNode() && !t_node_found){
					ref_node.exit();
					ref_node = ref_node.getParentNode();
					if (ref_node.id == t_node.id) t_node_found = true;
				}
				
			break;
			default:
				//iterative method
				this.goToNodeIterative(c_node,t_node);
			break;
		}
		
		//set target node as current node
		this.current_node = t_node;
		
		//LOAD LAYOUT
		if(_GecCastDisplay) _GecCastDisplay.load(this.current_node);
		
		//update ui modules
		if(_Navigator) _Navigator.update();
		if(_Inspector) _Inspector.update();

		//return resultant current node
		return this.current_node;
		
	},
	
	goToNodeIterative: function(c_node,t_node){
	
		//ok! we are gonna navigate from c_node(current node) top t_node(target node). Lets go!
		
		if (!c_node){
		//navigate from root
			
			this.enterStraight(null,t_node);
			
		}
		else{
		//navigate from current node
		
			//looks parents for a common parent between current and target node
			var ref_node = c_node;
			var common_parent = null;
			while (ref_node.hasParentNode() && !common_parent){
				//exits nodes at same that searchs
				ref_node.exit();
				ref_node = ref_node.getParentNode();
				if (ref_node.isParentNode(t_node)) common_parent = ref_node;
			}
			
			//was common parent found?
			if (common_parent){
				this.enterStraight(common_parent,t_node);
			}
			else{
				this.enterStraight(null,t_node);
			}

		}
		
		
	},
	
	enterStraight: function(parent_node,child_node){
	
		//Performs iterative 'enter' method on child nodes from parent_node to a known child_node

		//check if child_node is not child of parent_node
		if(parent_node) if(!parent_node.isParentNode(child_node)) return;
		
		//creates a parent nodes array from child node
		var child_node_parents = [];
		
		//looks parents and fills the array until reach known parent_node
		var ref_node = child_node;
		var parent_node_reached = false;
		while (ref_node.hasParentNode() && !parent_node_reached){
			ref_node = ref_node.getParentNode();
			if(parent_node) if(ref_node.id == parent_node.id) parent_node_reached = true;
			if(!parent_node_reached) child_node_parents.unshift(ref_node);
		}
		
		//call 'enter' method in each parent node
		for (var p=0; p<child_node_parents.length; p++){
			child_node_parents[p].enter();
		}
		
		//call 'enter' method in child node
		child_node.enter();
	
	}
	
	
});