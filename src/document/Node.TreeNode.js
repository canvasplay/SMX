(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with utility tree node methods
 * @mixin TreeNode
 * @memberof smx.fn
 */

let TreeNode = {
        
    // PARENT RELATED OPERATIONS

    /**
     * Gets the parent node
     * @method parent
     * @memberof smx.fn.TreeNode
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
            return $smx(this[0].parentNode);
        }


    },

    /**
     * Gets a list of parent nodes up to root
     * @method parents
     * @memberof smx.fn.TreeNode
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
            return $smx(parents);
        }
    },

    /**
     * get the top most parent node
     * @method root
     * @memberof smx.fn.TreeNode
     * @return {Node}
     */

    'root': function(){

        if (this.parent()){

            //get all ancestors
            var parents = this.parents();

            //return top most parent node
            return $smx(parents[0]);

        }

        return $smx(this);

    },


    // EXTRA - PARENT RELATED OPERATIONS

    /**
     * Checks if node is a parent of another
     * @method isParentOf
     * @memberof smx.fn.TreeNode
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
     * @memberof smx.fn.TreeNode
     * @return {Boolean}
     */
    hasParent: function(){

    return (this[0].parentNode)? true : false;

    },


    // CHILD RELATED OPERATIONS

    /**
     * get node by identifier
     * @method getNodeById
     * @memberof smx.fn.TreeNode
     * @alias gid
     * @return {Node}
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
     * @method match
     * @memberof smx.fn.TreeNode
     * @param {String} selector - css selector to match
     * @return {Boolean}
     */
    match: function(selector){
        return Sizzle.matchesSelector(this[0],selector);
    },


    /**
     * Finds all descendant nodes matching the given selector
     * @method find
     * @memberof smx.fn.TreeNode
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
        return $smx(nodes);
    },


    /**
     * This method is {@link Node node} like {@link Node/TreeNode~find find} but returns only the first result
     * @method one
     * @memberof smx.fn.TreeNode
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
        return $smx(node);

    },



    /**
     * get child nodes
     * @method children
     * @memberof smx.fn.TreeNode
     * @return {Array.<Node>}
     */
    children: function(){
        return $smx(this[0].childNodes);
    },


    /**
     * Get the first child node
     * @method first
     * @memberof smx.fn.TreeNode
     * @return {Node}
     */
    first : function(){
        return $smx(_.first(this[0].childNodes));
    },


    /**
     * Gets the last child node
     * @method last
     * @memberof smx.fn.TreeNode
     * @return {Node}
     */
    last : function(){
        return $smx(_.last(this[0].childNodes));
    },



    // EXTRA - CHILD RELATED OPERATIONS

    /**
     * Gets child node at given index
     * @method childAt
     * @memberof smx.fn.TreeNode
     * @param {Integer} index - index position
     * @return {Node}
     */
    childAt : function(index){
        return $smx(this[0].childNodes[index]);
    },


    /**
     * Checks if a node is child of another
     * @method isChildOf
     * @memberof smx.fn.TreeNode
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
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {Node}
     */
    next : function(selector){
        var el = this[0].nextElementSibling || this[0].nextSibling;
        return (selector)? (Sizzle.matchesSelector(el,selector))? $smx(el) : undefined : $smx(el);
    },

    /**
     * Gets previous sibling node
     * @method previous
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {Node}
     */
    previous : function(selector){
        var el = this[0].previousElementSibling || this[0].previousSibling;
        return (selector)? (Sizzle.matchesSelector(el,selector))? $smx(el) : undefined : $smx(el);
    },



    // FLAT TREE SIBLINGS

    /**
     * Gets previous node in a flat tree
     * @method getStepBack
     * @memberof smx.fn.TreeNode
     * @return {Node}
     */
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

    /**
     * get next node in a flat tree
     * @method getStepForward
     * @memberof smx.fn.TreeNode
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

};


//extends smx fn methods
smx.fn = (!smx.fn) ? { TreeNode } : Object.assign(smx.fn, { TreeNode });


})(window, window._, window.Sizzle, window.smx);