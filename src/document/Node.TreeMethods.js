(function(global, _, Sizzle, smx){



var TreeMethods = {
  
  
// PARENT RELATED OPERATIONS


/**
*   @method parent
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
*   @method parents
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
*   @method root
*   Find top most parent
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
*   @method isParentOf
*/
isParentOf: function(node){

    //validate given node (smx node required)
    if (!node.parents) return false;

    var parentsId = _.map(node.parents(),'id');
    if (_.includes(parentsId,this.id)) return true;
    else return false;

},

/**
*   @method hasParent
*/
hasParent: function(){

   return (this[0].parentNode)? true : false;

},


// CHILD RELATED OPERATIONS

getNodeById: function(id){

    //is nodes cache array?
    if($smx.cache[id]) return $smx.cache[id];

    //search in document
    var node = Sizzle('#'+id,this[0]);
    if (node.length>0) return $smx.node(node[0]);

    //not found
    return;

},

//GID  nice shortcut for getNodeById :D
gid: function(id){ return this.getNodeById(id) },



/**
*   @method match
*/
match: function(selector){
    return Sizzle.matchesSelector(this[0],selector);
},


/**
*   @method find
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
*   @method one
*   Like find but returns only first matching node
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
*   @method children
*/
children: function(){
    return $smx.node(this[0].childNodes);
},


/**
*   @method first
*/
first : function(){
    return $smx.node(_.first(this[0].childNodes));

},


/**
*   @method last
*/
last : function(){
    return $smx.node(_.last(this[0].childNodes));
},



// EXTRA - CHILD RELATED OPERATIONS

/**
*   @method childAt
*/
childAt : function(index){
    return $smx.node(this[0].childNodes[index]);
},


/**
*   @method isChildOf
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
*   @method next
*/
next : function(selector){
    var el = this[0].nextElementSibling || this[0].nextSibling;
    return (selector)? (Sizzle.matchesSelector(el,selector))? $smx.node(el) : undefined : $smx.node(el);
},

/**
*   @method previous
*/
previous : function(selector){
    var el = this[0].previousElementSibling || this[0].previousSibling;
    return (selector)? (Sizzle.matchesSelector(el,selector))? $smx.node(el) : undefined : $smx.node(el);
},



// FLAT TREE SIBLINGS

/**
*   @method getStepBack
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
*   @method getStepForward
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