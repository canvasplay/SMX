import Sizzle from 'sizzle';

/**
 * Extends {@link smx.Node Node} with tree traversal utility methods.
 * @mixin Node-Traversal
 * @see smx.Node
 */

let Traversal = {

  /**
   * Gets a list of all ancestor nodes matching the given selector, ordered from outer to inner.
   * @param {String} selector
   * @return {smx.Node[]}
   * @memberof Node-Traversal
   */
  getAncestors: function(selector){
    
    if(!selector) return this.ancestors;
    return this.ancestors.filter((n)=>n.isMatch(selector));
    
  },
  
  // EXTRA - PARENT RELATED OPERATIONS

  /**
   * Checks if node is an ancestor of another.
   * @param {smx.Node} node - reference node
   * @return {Boolean}
   * @memberof Node-Traversal
   */
  isAncestorOf: function(node){
    
    if (!node.parent) return false;
    var ancestorsId = node.ancestors.map((n)=>{ return n.id });
    if (ancestorsId.indexOf(this.id)>-1) return true;
    else return false;
    
  },


  /**
   * Checks if node matches the given selector.
   * @param {String} selector - css selector to match
   * @return {Boolean}
   * @memberof Node-Traversal
   */
  isMatch: function(selector) {
    
    return Sizzle.matchesSelector(this[0],selector);
    
  },
  
  // CHILD RELATED OPERATIONS

  /**
   * Finds all descendant nodes matching the given selector.
   * @param {String} selector - search selector
   * @return {Array.<Node>}
   * @memberof Node-Traversal
   */
  find: function(selector) {
    
    if (!selector) return [];
    if (!this.children.length) return [];
    
    return this.document.find(selector, this);
    
  },


  /**
   * This method is like `find` but returns only the first result.
   * @param {String} selector - search selector
   * @return {smx.Node}
   * @memberof Node-Traversal
   */
  findOne: function(selector) {
    
    return this.find(selector)[0];
    
  },



  /**
   * Gets the children nodes matching the given selector.
   * @param {String=} selector
   * @return {Array.<Node>}
   * @memberof Node-Traversal
   */
  getChildren: function(selector) {
    
    if(!selector) return this.children;
    
    return this.children.filter((n) => n.isMatch(selector));
    
  },
  

  /**
   * Gets the first child node matching the given selector.
   * @param {String=} selector
   * @return {smx.Node}
   * @memberof Node-Traversal
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
   * @param {String=} selector
   * @return {smx.Node}
   * @memberof Node-Traversal
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
   * @param {Integer} index - index position
   * @return {smx.Node}
   * @memberof Node-Traversal
   */
  getChildAt: function(index) {
    
    return this.children[index];
    
  },


  /**
   * Checks if a node is child of another
   * @param {smx.Node} node - reference node
   * @return {Boolean}
   * @memberof Node-Traversal
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
   * @param {String=} selector - filter selector
   * @return {smx.Node}
   * @memberof Node-Traversal
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
   * @param {String=} selector - filter selector
   * @return {smx.Node[]}
   * @memberof Node-Traversal
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
   * @param {String=} selector - filter selector
   * @return {smx.Node}
   * @memberof Node-Traversal
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
   * @param {String=} selector - filter selector
   * @return {smx.Node[]}
   * @memberof Node-Traversal
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

export default Traversal;