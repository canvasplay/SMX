/**
 * SMX Node Class
 * Provides basic methods for content tree interaction
 */

SMX.document = {};

SMX.document.Node = new JS.Class({

	nodeName: 'NODE',
	
	id:null,
	
	parent:null,
	
	children:[],
	
	initialize: function(){
	
		this.nodeName = 'NODE';
		
		this.id = null;
		
		this.parent = null;
		
		this.children = [];
		
	},

	/**
     * getIndex
     * @return {int} index position in his parent children
     */
	getIndex : function(){
	
		if (this.hasParentNode()){
			return this.parent.children.indexOf(this);
		}
		else{
			return;
		}
	},
	
	/**
     * Method: getTreeIndex
     * @param {depth} (optional) level depth, depth<0 will loop until find root, default:-1
     * @return {Array of int} index position in consecutive parent children
     */
	getTreeIndex : function(depth){
		
		//declare return array
		var tree_index = [];
		
		//determine depth
		depth = (depth)? parseInt(depth) : -1;

		//get current node index
		tree_index.unshift(this.getIndex());
		
		
		//get parents index
		var ref_node = this;
		

		if (depth>0){
		//loop up n node depths
		
			while( ref_node.hasParent() && depth>0 ){
				ref_node = parent.getParent();
				tree_index.unshift(ref_node.getIndex());
				depth--;
			}
		
		}
		else if(depth<0){
		//loop up until find root node
		
			while( ref_node.hasParentNode() ){
				ref_node = ref_node.getParentNode();
				var _i = ref_node.getIndex();
				if(!isNaN(_i)) tree_index.unshift(_i);
			}
		
		} 
		
		return tree_index;
		
	},
	
	/**
     * Method: getTreeId
     * @param {depth} (optional) level depth, depth<0 will loop until find root, default:-1
     * @return {Array of int} index position in consecutive parent children
     */
	getTreeId : function(depth){
		
		//declare return array
		var root_array = [];
		
		//determine depth
		depth = (depth)? parseInt(depth) : -1;

		//get current node index
		root_array.unshift(this.id);
		
		
		//get parents index
		var ref_node = this;
		

		if (depth>0){
		//loop up n node depths
		
			while( ref_node.hasParent() && depth>0 ){
				ref_node = parent.getParent();
				root_array.unshift(ref_node.id);
				depth--;
			}
		
		}
		else if(depth<0){
		//loop up until find root node
		
			while( ref_node.hasParentNode() ){
				ref_node = ref_node.getParentNode();
				root_array.unshift(ref_node.id);
			}
		
		} 
		
		return root_array;
		
	},
	
	/**
     * Method: HasParentNode
     * @return {Boolean} wheter has or not parentNode
     */
	hasParentNode : function(){
		return (this.parent)? true : false;
	},
	
	/**
     * Method: getParentNode
     * @return {Node} parentNode
     */
	getParentNode : function(){
		return this.parent;
	},
	
	/**
     * Method: setParentNode
	 * @param {Node} Node to set as parentNode
     */
	setParentNode : function(_node){
		if (!_node) return;
		this.parent = _node;
	},
	
	/**
     * Method: isParentNode
	 * @param {Node} Node to set as parentNode
     */
	isParentNode : function(_node){
	
		var is_parent = false;

		if (!_node.hasParentNode()){
			return is_parent;
		}
		else{
			var node_ref = _node;
			while (node_ref.hasParentNode() && !is_parent){
				var node_ref  = node_ref.getParentNode();
				if (node_ref.id == this.id) is_parent = true;
			}
		}
		
		return is_parent;
	},

	/**
     * Method: hasChildNodes
     * @return {Boolean} has or has not childNodes
     */
	hasChildNodes : function(){
		return (this.children.length>0);
	},
	
	/**
     * Method: getChildNodes
     * @return {Node[]} childNodes Array
     */
	getChildNodes : function(){
		return this.children;
	},

	/**
     * Method: getFirstChildNode
     * @return {Node} first childNode
     */
	getFirstChildNode : function(){
		return (this.children[0]);
	},
	
	/**
     * Method: getLastChildNode
     * @return {Node} last childNode
     */
	getLastChildNode : function(){
		return (this.children[this.children.length-1]);
	},
	
	/**
     * Method: addChildNode
     * @param {Node} Node to be added as childNode
     * @return {Node} Node added or null if method failed
     */
	addChildNode : function(_node){
		
		if(!_node) return;
		
		_node.parent = this;
		
		this.children.push(_node);
		
		return _node;
	},
	
	/**
     * Method: getPreviousSibling
     * @return {Node} previousNode from same parentNode
     */
	getPreviousSibling : function(){
		if (!this.hasParentNode()) return;
		return this.parent.children[this.getIndex()-1];
	},

	/**
     * Method: getNextSibling
     * @return {Node} nextNode from same parentNode
     */
	getNextSibling : function(){
		if (!this.hasParentNode()) return;
		return this.parent.children[this.getIndex()+1];
	},
	
	/**
     * Method: getPreviousNode
     * @return {Node} previousNode from TreeNode
     */
	getPreviousNode: function(from_first_child){
	
		//in recursive calls indicate if last recursion come from lastChild of its parent
		var _from_first_child = (from_first_child)? from_first_child : false;
		
	
		//2. search previousSibling:
		var _prev_sibling_node = this.getPreviousSibling();
		if(_prev_sibling_node) return _prev_sibling_node;
		
		//3. search on parentNode
		var _parent_node = this.getParentNode();
		if(_parent_node) return _parent_node;

		//4. nothing found: return null!!
		return;

		
	},

	/**
     * Method: getNextNode
     * @return {Node} nextNode from TreeNode
     */
	getNextNode: function(from_last_child){
	
		//in recursive calls indicate if last recursion come from lastChild of its parent
		var _from_last_child = (from_last_child)? from_last_child : false;
		
		// 1. search on children: try to get deep inside current node
		// if (_from_last_child) means we arleady searched on childNodes and avoid it
		// we avoid search on scenes shildnodes too (nodes with timeline)
		if (!_from_last_child && this.nodeName != 'SCENE'){
			var _first_childnode = this.getFirstChildNode();
			return _first_childnode;
		}
	
		//2. search nextSibling:
		var _next_sibling_node = this.getNextSibling();
		if(_next_sibling_node) return _next_sibling_node;
		
		//3. search on parentNode
		var _parent_node = this.getParentNode();
		if(_parent_node) return _parent_node.getNextNode(true);

		//4. nothing found: return null!!
		return;

		
	}


});
