(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with utility tree node methods
 * @mixin TreeNode
 * @memberof smx.fn
 */

let TreeNode = {

  // PARENT RELATED OPERATIONS

  /**
   * Gets a list of parent nodes up to root, ordered from outer to inner.
   * @memberof smx.fn.TreeNode
   * @return {SMXNode[]}
   */
  getAncestors: function(selector){
      
    if(!selector) return this.ancestors;
    
    return this.ancestors.filter((n)=>n.isMatch(selector));

  },
  
  // EXTRA - PARENT RELATED OPERATIONS

  /**
   * Checks if node is an ancestor of another.
   * @memberof smx.fn.TreeNode
   * @param {SMXNode} node - reference node
   * @return {Boolean}
   */
  isAncestorOf: function(node){

    if (!node.parent) return false;
    var ancestorsId = node.ancestors.map((n)=>{ return n.id });
    if (ancestorsId.indexOf(this.id)>-1) return true;
    else return false;

  },


  // CHILD RELATED OPERATIONS

  /**
   * Gets the node with the given identifier.
   * @memberof smx.fn.TreeNode
   * @alias gid
   * @return {SMXNode}
   */
  getNodeById: function(id){

      //is nodes cache array?
      if($smx.cache[id]) return $smx.cache[id];

      //search in document
      var node = Sizzle('#'+id,this[0])[0];
      if (node) return $smx(node[0]);

      //not found
      return;

  },

  gid: function(id){ return this.getNodeById(id) },



  /**
   * Checks if node matches the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String} selector - css selector to match
   * @return {Boolean}
   */
  isMatch: function(selector) {
    
    return Sizzle.matchesSelector(this[0],selector);
    
  },


  /**
   * Finds all descendant nodes matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String} selector - search selector
   * @return {Array.<Node>}
   */
  find: function(selector) {
    
    if (!selector) return [];
    if (!this.children.length) return [];
    var nodes = Sizzle(selector,this[0]);
    //if(nodes.length) nodes = _.uniqBy(nodes,'id');
    return $smx(nodes);
    
  },


  /**
   * This method is like `find` but returns only the first result.
   * @memberof smx.fn.TreeNode
   * @param {String} selector - search selector
   * @return {SMXNode}
   */
  one: function(selector) {
    
    return this.find(selector)[0];
    
  },



  /**
   * Gets the children nodes matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector
   * @return {Array.<Node>}
   */
  getChildren: function(selector) {
    
    if(!selector) return this.children;

    return this.children.filter((n) => n.isMatch(selector));
    
  },
  

  /**
   * Gets the first child node matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector
   * @return {SMXNode}
   */
  getFirst: function(selector) {
    
    if(!selector) return this.first;
    
    var children = this.children;
    var i=0, len=children.length, result;
    while(i<len && !result){
      if (children[i].isMatch(selector))
        result = children[i];
      i++;
    }

    return result;
    
  },


  /**
   * Gets the last child node matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector
   * @return {SMXNode}
   */
  getLast: function(selector) {
    
    if(!selector) return this.last;
    
    var children = this.children.reverse();
    var i=0, len=children.length, result;
    while(i<len && !result){
      if (children[i].isMatch(selector))
        result = children[i];
      i++;
    }

    return result;
    
  },



  // EXTRA - CHILD RELATED OPERATIONS

  /**
   * Gets child node at given index
   * @memberof smx.fn.TreeNode
   * @param {Integer} index - index position
   * @return {SMXNode}
   */
  getChildAt: function(index) {
    
    return this.children[index];
    
  },


  /**
   * Checks if a node is child of another
   * @memberof smx.fn.TreeNode
   * @param {SMXNode} node - reference node
   * @return {Boolean}
   */
  isDescendantOf: function(node) {
    
    if (!node.parent) return false;
    var ancestorsId = this.ancestors.map((n) => { return n.id });
    if (ancestorsId.indexOf(node.id)>-1) return true;
    else return false;
    
  },


  // SIBLING RELATED OPERATIONS


  /**
   * Gets the next sibling node matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector - filter selector
   * @return {SMXNode}
   */
  getNext: function(selector) {

    if(!selector)
      return this.next;
    else {
      var n = this.next;
      var isMatch = false;
      while (!isMatch && n) {
        if(n.isMatch(selector))
          isMatch = true;
        else
          n = n.next;
      }
      return (isMatch)? n : undefined;
    }

  },

  /**
   * Gets all next sibling nodes matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector - filter selector
   * @return {SMXNode[]}
   */
  getAllNext: function (selector) {

    if (!this.next) return [];
    else {
      //fill up nodes array walking all next nodes
      var n = this.next;
      var nodes = [n];
      while (n && n.next) {
        n = n.next;
        nodes.push(n);
      }
      if(!selector)
        return nodes;
      else //return filtered by selector
        return nodes.filter((n) => { return n.isMatch(selector) });
    }

  },

  /**
   * Gets the previous sibling node matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector - filter selector
   * @return {SMXNode}
   */
  getPrevious: function(selector) {

    if (!selector)
      return this.previous;
    else {
      var n = this.previous;
      var isMatch = false;
      while (!isMatch && n) {
        if (n.isMatch(selector))
          isMatch = true;
        else
          n = n.previous;
      }
      return (isMatch) ? n : undefined;
    }

  },

  /**
   * Gets all previous sibling nodes matching the given selector.
   * @memberof smx.fn.TreeNode
   * @param {String=} selector - filter selector
   * @return {SMXNode[]}
   */
  getAllPrevious: function (selector) {
    if (!this.previous) return [];
    else {
      //fill up nodes array walking all previous nodes
      var n = this.previous;
      var nodes = [n];
      while (n && n.previous) {
        n = n.previous;
        nodes.unshift(n);
      }
      if (!selector)
        return nodes;
      else //return filtered by selector
        return nodes.filter((n) => { return n.isMatch(selector) });
    }
  }
  
};


//extends smx fn methods
smx.fn = (!smx.fn) ? { TreeNode } : Object.assign(smx.fn, { TreeNode });


})(window, window._, window.Sizzle, window.smx);