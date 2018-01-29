(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with utility tree node methods
 * @mixin TreeNode
 * @memberof smx.fn
 */

let TreeNode = {

    // PARENT RELATED OPERATIONS

    /**
     * Gets a list of parent nodes up to root
     * @method parents
     * @memberof smx.fn.TreeNode
     * @return {SMXNode[]}
     */
    getAncestors: function(selector){
        
        if(!selector) return this.ancestors;
        if (!this[0].parentNode) return [];
        else{
            var parent = this.parent();
            var parents = [parent];
            while (parent && parent.parent()){
                parent = parent.parent();
                if(parent) parents.unshift(parent);
            }
            return $smx(parents);
        }
    },
    
    // EXTRA - PARENT RELATED OPERATIONS

    /**
     * Checks if node is a parent of another
     * @method isParentOf
     * @memberof smx.fn.TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isParentOf: function(node){

        //validate given node (smx node required)
        if (!node.parents) return false;

        var parentsId = _.map(node.parents(),'id');
        if (_.includes(parentsId,this.id)) return true;
        else return false;

    },


    // CHILD RELATED OPERATIONS

    /**
     * get node by identifier
     * @method getNodeById
     * @memberof smx.fn.TreeNode
     * @alias gid
     * @return {SMXNode}
     */
    getNodeById: function(id){

        //is nodes cache array?
        if($smx.cache[id]) return $smx.cache[id];

        //search in document
        var node = Sizzle('#'+id,this[0]);
        if (node.length>0) return $smx(node[0]);

        //not found
        return;

    },

    gid: function(id){ return this.getNodeById(id) },



    /**
     * Checks if node matches the given selector
     * @method isMatch
     * @memberof smx.fn.TreeNode
     * @param {String} selector - css selector to match
     * @return {Boolean}
     */
    isMatch: function(selector) {
      
      return Sizzle.matchesSelector(this[0],selector);
      
    },


    /**
     * Finds all descendant nodes matching the given selector
     * @method find
     * @memberof smx.fn.TreeNode
     * @param {String} selector - search selector
     * @return {Array.<Node>}
     */
    find: function(selector) {
      
      if (!this.children.length) return [];
      if (!selector) return [];
      var nodes = Sizzle(selector,this[0]);
      if(nodes.length) nodes = _.uniqBy(nodes,'id');
      return $smx(nodes);
      
    },


    /**
     * This method is `find` but returns only the first result
     * @method one
     * @memberof smx.fn.TreeNode
     * @param {String} selector - search selector
     * @return {SMXNode}
     */
    one: function(selector) {
      
      return this.find(selector)[0];
      
    },



    /**
     * get child nodes
     * @method getChildren
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {Array.<Node>}
     */
    getChildren: function(selector) {
      
      if(!selector) return this.children;
      
      return this.children.map(function(n){
        return Sizzle.matchesSelector(n,selector);
      });
      
    },
    
  
    /**
     * Get the first child node
     * @method getFirst
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {SMXNode}
     */
    getFirst: function(selector) {
      
      if(!selector) return this.first;
      
      var children = this.children;
      var i=0, len=children.length, result;
      while(i<len && !result){
        if (Sizzle.matchesSelector(children[i],selector))
          result = children[i];
        i++;
      }
      
    },


    /**
     * Gets the last child node
     * @method getLast
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {SMXNode}
     */
    getLast: function(selector) {
      
      if(!selector) return this.last;
      
      var children = this.children.reverse();
      var i=0, len=children.length, result;
      while(i<len && !result){
        if (Sizzle.matchesSelector(children[i],selector))
          result = children[i];
        i++;
      }
      
    },



    // EXTRA - CHILD RELATED OPERATIONS

    /**
     * Gets child node at given index
     * @method getChildAt
     * @memberof smx.fn.TreeNode
     * @param {Integer} index - index position
     * @return {SMXNode}
     */
    getChildAt: function(index) {
      
      return this.children[index];
      
    },


    /**
     * Checks if a node is child of another
     * @method isDescendantOf
     * @memberof smx.fn.TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isDescendantOf: function(node) {
      
      //validate given node (smx node required)
      if (!node.parent) return false;
      
      var parentsId = _.map(this.ancestors,'id');
      if (_.includes(parentsId,node.id)) return true;
      else return false;
      
    },


    // SIBLING RELATED OPERATIONS


    /**
     * Gets next sibling node
     * @method next
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getNext: function(selector) {
        var el = this[0].nextElementSibling || this[0].nextSibling;
        return (selector)? (Sizzle.matchesSelector(el,selector))? $smx(el) : undefined : $smx(el);
    },

    /**
     * Gets previous sibling node
     * @method previous
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getPrevious: function(selector) {
        var el = this[0].previousElementSibling || this[0].previousSibling;
        return (selector)? (Sizzle.matchesSelector(el,selector))? $smx(el) : undefined : $smx(el);
    }



    // FLAT TREE SIBLINGS

    /**
     * Gets previous node in a flat tree
     * @method getStepBack
     * @memberof smx.fn.TreeNode
     * @return {SMXNode}
     
    stepBack: function(){

        //previousSibling?
        var _prev_sibling_node = this.previous();
        if(_prev_sibling_node) return $smx(_prev_sibling_node);

        //parentNode?
        var _parent_node = this.parent();
        if(_parent_node) return $smx(_parent_node);

        //nothing found...
        return;

    },
    */
    
    /**
     * get next node in a flat tree
     * @method getStepForward
     * @memberof smx.fn.TreeNode
     * @return {SMXNode}
    
    stepForward: function(from_last_child){

        //in recursive calls indicate if last recursion come from lastChild of its parent
        var _from_last_child = (from_last_child)? from_last_child : false;

        // 1. use children, trying to get deep inside node
        // if (_from_last_child) means we arleady searched on childNodes and avoid it
        // we avoid children when content is not smx
        if (!_from_last_child && this.get('type')==='smx' && !this.time('timed')){

            var _first_childnode = this.first();

            if (_first_childnode.get('type')==='smx' ){
                return $smx(_first_childnode);
            }
        }

        //2. search nextSibling:
        var _next_sibling_node = this.next();
        if(_next_sibling_node) return $smx(_next_sibling_node);

        //3. search on parentNode
        var _parent_node = this.parent();
        if(_parent_node) return $smx(_parent_node.stepForward(true));

        //4. nothing found: return null!!
        return;

    }
    */
};


//extends smx fn methods
smx.fn = (!smx.fn) ? { TreeNode } : Object.assign(smx.fn, { TreeNode });


})(window, window._, window.Sizzle, window.smx);