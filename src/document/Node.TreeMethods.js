(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with utility tree methods
 * @module Node/TreeMethods
 */

var TreeMethods = {
  
  
// PARENT RELATED OPERATIONS

/**
 * Gets the parent node
 * @method parent
 * @param {String} selector - filter selector
 * @return {Node}
 */
parent: function(selector){

    if(!_.isEmpty(selector)){

        var parents = this.parents();
        var found;
        while(parents.length>0 && !found){
            var p = parents.pop();
            if(p.match(selector)) found = p;
        }

        return found;

    }
    else{
        return $smx.node(this[0].parentNode);
    }


},

/**
 * Gets a list of parent nodes up to root
 * @method parents
 * @return {Node[]}
 */
parents: function(){

    if (!this[0].parentNode) return [];
    else{
        var parent = this.parent();
        var parents = [parent];
        while (parent && parent.parent()){
            parent = parent.parent();
            if(parent) parents.unshift(parent);
        }
        return parents;
    }
},

/**
* get the top most parent node
* @method root
* @return {Node}
*/

'root': function(){

    if (this.parent()){

        //get all ancestors
        var parents = this.parents();

        //return top most parent node
        return parents[0];

    }

    return this;

},


// EXTRA - PARENT RELATED OPERATIONS

/**
 * resolve wether a node is parent of another
 * @method isParentOf
 * @param {Node} node - reference node
 * @return {Boolean}
 */
isParentOf: function(node){

    //validate given node (smx node required)
    if (!node.parents) return false;

    var parentsId = _.map(node.parents(),'id');
    if (_.includes(parentsId,this.id)) return true;
    else return false;

},

/**
 * resolve wether a node has a parent or not
 * @method hasParent
 * @return {Boolean}
 */
hasParent: function(){

   return (this[0].parentNode)? true : false;

},


// CHILD RELATED OPERATIONS

/**
 * get node by identifier
 * @method getNodeById
 * @alias gid
 * @return {Node}
 */
getNodeById: function(id){

    //is nodes cache array?
    if($smx.cache[id]) return $smx.cache[id];

    //search in document
    var node = Sizzle('#'+id,this[0]);
    if (node.length>0) return $smx.node(node[0]);

    //not found
    return;

},

gid: function(id){ return this.getNodeById(id) },



/**
 * Checks if node matches the given selector
 * @method match
 * @param {String} selector - css selector to match
 * @return {Boolean}
 */
match: function(selector){
    return Sizzle.matchesSelector(this[0],selector);
},


/**
 * Finds all descendant nodes matching the given selector
 * @method find
 * @param {String} selector - search selector
 * @return {Array.<Node>}
 */
find: function(selector){

    if (!this[0].childNodes.length) return [];
    if (!_.isString(selector) || _.isEmpty(selector)) return [];

    //var query = selector || '>';
    var query = selector;

    //get search context
    var nodes = [];
    try{ nodes = Sizzle(query,this[0]); }
    catch(e){}

    //ensure returning unique nodes
    if(_.isArray(nodes)) nodes = _.uniqBy(nodes,'id');

    //return smx node array
    return $smx.node(nodes);
},


/**
 * This method is {@link Node node} like {@link Node/TreeMethods~find find} but returns only the first result
 * @method one
 * @param {String} selector - search selector
 * @return {Node}
 */
one: function(selector){

    if (!this[0].childNodes.length) return;
    if (!_.isString(selector) || _.isEmpty(selector)) return;

    //var query = selector || '>';
    var query = selector;

    //get search context
    var nodes = [];
    try{ nodes = Sizzle(query,this[0]); }
    catch(e){}

    var node = nodes[0];

    //return smx node
    return $smx.node(node);

},



/**
 * get child nodes
 * @method children
 * @return {Array.<Node>}
 */
children: function(){
    return $smx.node(this[0].childNodes);
},


/**
 * Get the first child node
 * @method first
 * @return {Node}
 */
first : function(){
    return $smx.node(_.first(this[0].childNodes));
},


/**
 * Gets the last child node
 * @method last
 * @return {Node}
 */
last : function(){
    return $smx.node(_.last(this[0].childNodes));
},



// EXTRA - CHILD RELATED OPERATIONS

/**
 * Gets child node at given index
 * @method childAt
 * @param {Integer} index - index position
 * @return {Node}
 */
childAt : function(index){
    return $smx.node(this[0].childNodes[index]);
},


/**
 * Checks if a node is child of another
 * @method isChildOf
 * @param {Node} node - reference node
 * @return {Boolean}
 */
isChildOf: function(node){

    //validate given node (smx node required)
    if (!node.parents) return false;
    
    var parentsId = _.map(this.parents(),'id');
    if (_.includes(parentsId,node.id)) return true;
    else return false;
  
},


// SIBLING RELATED OPERATIONS


/**
 * Gets next sibling node
 * @method next
 * @param {String=} selector - filter selector
 * @return {Node}
 */
next : function(selector){
    var el = this[0].nextElementSibling || this[0].nextSibling;
    return (selector)? (Sizzle.matchesSelector(el,selector))? $smx.node(el) : undefined : $smx.node(el);
},

/**
 * Gets previous sibling node
 * @method previous
 * @param {String=} selector - filter selector
 * @return {Node}
 */
previous : function(selector){
    var el = this[0].previousElementSibling || this[0].previousSibling;
    return (selector)? (Sizzle.matchesSelector(el,selector))? $smx.node(el) : undefined : $smx.node(el);
},



// FLAT TREE SIBLINGS

/**
 * Gets previous node in a flat tree
 * @method getStepBack
 * @return {Node}
 */
stepBack: function(){

    //previousSibling?
    var _prev_sibling_node = this.previous();
    if(_prev_sibling_node) return _prev_sibling_node;

    //parentNode?
    var _parent_node = this.parent();
    if(_parent_node) return _parent_node;

    //nothing found...
    return;

},

/**
 * get next node in a flat tree
 * @method getStepForward
 * @return {Node}
 */
stepForward: function(from_last_child){

    //in recursive calls indicate if last recursion come from lastChild of its parent
    var _from_last_child = (from_last_child)? from_last_child : false;

    // 1. use children, trying to get deep inside node
    // if (_from_last_child) means we arleady searched on childNodes and avoid it
    // we avoid children when content is not smx
    if (!_from_last_child && this.get('type')==='smx' && !this.time('timed')){

        var _first_childnode = this.first();

        if (_first_childnode.get('type')==='smx' ){
            return _first_childnode;
        }
    }

    //2. search nextSibling:
    var _next_sibling_node = this.next();
    if(_next_sibling_node) return _next_sibling_node;

    //3. search on parentNode
    var _parent_node = this.parent();
    if(_parent_node) return _parent_node.stepForward(true);

    //4. nothing found: return null!!
    return;

}

};




//extend SMXNode prototype
_.extend(smx.Node.prototype,TreeMethods);



})(window, window._, window.Sizzle, window.smx);