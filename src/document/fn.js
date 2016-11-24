(function(global, _, Sizzle, smx){


//private namespace for SMX functions
var fn = {};



/**
 *  COMPUTED ATTRIBUTES
 *
 *  Methods returning calculated values from attribute values
 *
 *
 */

fn.ComputedAttributes = {

    /**
     *  @method uri
     *  Uniform Resource Identifier,"url id"
     *  Calculate url hash path using cummulative ids up to root
     */

    'uri' : function(node){

        var hash = node.id + '/';
        var parent = node.parent();
        if (parent) return parent.get('uri') + hash;
        else        return hash;

    },


    /**
     *  @method url
     *  Uniform Resource Locator (url path)
     *  Calculate url folder path using cummulative paths up to root
     */

    'url': function(node){

        let path = node.get('path');

        let parent = node.parent();

        if (parent){
            if(_.isEmpty(path))
                return parent.get('url');
            else{

                //add trail slash
                let trail = path.substr(-1);
                if (trail != '/') path += '/';

                return parent.get('url') + path;
            }

        }
        else{

            if(_.isEmpty(path)) return;

            //add trail slash
            let trail = path.substr(-1);
            if (trail != '/') path += '/';

            return path;

        }

    },

    /**
     *  @method file
     *  url of xml source file of this node
     */

    'file': function(node){

      let url = '';
      let file = node.attr('file');
      let parent = node.parent();
      
      if (_.isEmpty(file))
        return (parent)? parent.get('file') : undefined;
        
      else
        return node.get('url') + file;
          
    },

    /**
     *  @method index
     *  position in parent children
     */

    'index': function(node, selector){

        //0 by default
        var index = 0;

        //get parent node
        var parent = node.parent();

        //no parent? its kind of root so it has no sibling nodes
        if(!parent) return index;

        //get sibling nodes
        var siblings = parent.children();

        //filter siblings collection with a css selector if its defined
        if(selector) siblings = _.filter(siblings, function(s){ return Sizzle.matchesSelector(s[0],selector) });

        //get position in siblings collection
        index = siblings.indexOf(node);

        return index;

    },

    /**
     *  @method link
     *  calculates browser url
     */

    'link': function(node){

        return '#!/' + node.get('uri');

    },

    /**
     *  @method type
     *  return smx node type with 'smx' as default
     */

    'type': function(node){

        return node[0].attributes['type'] || 'smx';

    },


    /**
     *  @method classes
     *  return class attribute as array of
     */

    'classes': function(node){

        return (node[0].attributes['class'] || '').split(' ');

    }


};








//////////////////////////
// ATTRIBUTE GETTERS

fn.AttributeGetters = {


    /**
    *   @method raw
    *   @desc Get the raw value for specified attribute key in the original xml node
    *   @param key {string} The name of the attribute
    *   @return {string} resulting value
    *
    */

    raw:function(key){

        return this[0].getAttribute(key);

    },


    /**
    *
    *   Get the value for specified attribute key in attributes collection
    *
    *   @method attr
    *   @param key {String} The name of the attribute
    *   @return {String} resulting value
    *
    */
    attr:function(key){

        return this.raw(key);
    },

    /**
    *
    *   Determine if node has the specified key attribute
    *
    *   @method has
    *   @param key {String} The name of the attribute
    *   @return {Bollean} resulting value
    *
    */
    has:function(key){

        //return this[0].hasAttribute(key);
        //IE8 does not support XMLNode.hasAttribute, so...
        return (this[0].getAttribute(key) !== null);
        
    },


    /**
    *
    *   Get the value for specified attribute key, computed or not
    *   If there is no computed attribute with given key will use attr method
    *
    *   @method get
    *   @param key {string} The name of the attribute
    *   @return resulting value
    *
    */
    get:function(key, options){

        //key is required to be non empty string
        if(_.isEmpty(key) || !_.isString(key)) return;

        //try using defined attribute getter
        var getter = smx.fn.ComputedAttributes[key];
        if(_.isFunction(getter)) return getter(this,options);

        //use default attr getter
        return this.attr(key);

    },


    /**
     *  @method dsv
     *  An utility method converts given attribute value into dsv array
     *
     *  @param key {string} the name of the attribute
     *  @param delimiter {string} defaults to ' '
     *  @return dsv array
     *
     */

    dsv: function(key, delimiter){

        //ignore undefined attributes
        if(!this.has(key)) return;

        //get attr's value by key
        var value = this.attr(key);

        var d = delimiter || ' ';

        //if attribute exists value must be String
        if(!_.isString(value)) return [];

        //split value by delimiter
        var list = value.split(delimiter);

        //trim spaces nicely handling multiple spaced values
        list = _.map(list,function(str){

            str = str.replace(/^\s+/, '');
            for (var i = str.length - 1; i >= 0; i--) {
                if (/\S/.test(str.charAt(i))) {
                    str = str.substring(0, i + 1);
                    break;
                }
            }
            return str;

        });

        //clean empty values
        list = _.without(list,'',' ');

        return list;


    },
    
    /**
     *  @method csv
     *  Utility method, converts the given key attribute value into csv array
     *
     *  @param key {string} the name of the attribute
     *  @return csv array
     *
     */

    csv: function(key){
      
      return this.dsv(key,',');
      
    }

};






fn.CoreMethods = {

    //return serialization of original XML node
    toString: function(){

        //this looks better for console loggin...
        return this.name + '#' + this.id;

    },

    //return serialization of original XML node
    text: function(){

        var str = this[0].text || this[0].textContent;

        return str;

    },
    
    //return serialization of original XML node
    getInnerHTML: function(){

        var childs = this[0].childNodes;

        var str = '';

        if (childs.length){
            _.each(childs,function(item,index){
                str+= item.xml || (new XMLSerializer()).serializeToString(item);
            });
        }

        return str;

    },

    toJSON: function(){

        var attrs = this[0].attributes;

        var json = {};

        json.id = this.id;

        json.name = this.name;

        json.url = this.get('url');
        json.uri = this.get('uri');

        //export meta
        json.meta = {};
        json.track = {};
       for(var i = 0; i < attrs.length; i++) {

            var attr_name = attrs[i].name+'';
            var attr_value = attrs[i].name+'';

            if(attr_name.indexOf("meta-") === 0){
                attr_name = attr_name.substr(5);
                json.meta[attr_name] = attrs[i].value;
            }
            else if(attr_name.indexOf("track-") === 0){
                attr_name = attr_name.substr(6);
                json.track[attr_name] = attrs[i].value;
            }

        }

        //export children

        var childs = this.children();

        if(childs.length>0){

            json.children = [];

            for(var i=0; i<childs.length;i++){

                json.children.push(childs[i].toJSON());

            }

        }


        return json;
    }





};


//////////////////////////
// TREE NODE OPERATIONS


fn.TreeNodeMethods = {


    /**
    *   @method match
    */
    match: function(selector){
        return Sizzle.matchesSelector(this[0],selector);
    },


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

            var parents = node.parents();
            if (_.contains(parents,this)) return true;
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
        *   @method find
        */
        find: function(selector){

            if (!this[0].childNodes.length>0) return [];
            if (!_.isString(selector) || _.isEmpty(selector)) return [];

            //var query = selector || '>';
            var query = selector;

            //get search context
            var nodes = [];
            try{ nodes = Sizzle(query,this[0]); }
            catch(e){}

            //ensure returning unique nodes
            if(_.isArray(nodes)) nodes = _.unique(nodes);

            //return smx node array
            return $smx.node(nodes);
        },


        /**
        *   @method one
        *   Like find but returns only first matching node
        */
        one: function(selector){

            if (!this[0].childNodes.length>0) return;
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

            var parents = this.parents();
            if (_.contains(parents,node)) return true;
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









/**
 *  REL ATTRIBUTES INTERFACE
 *
 *  Plugin Method for attributes namespaced with 'rel'
 *  rel attributes may indicate the id of a somehow related node
 *
 */

fn.RelAttrInterface = {

    /**
    *   @method rel
    */
    rel: function(key){

        if(!this.has('rel-'+key)) return;
        
        var relId = this.get('rel-'+key);

        return this.root.gid(relId);

    }


};









////////////////////////////////
// UI ATTRIBUTES INTERFACE
// shortcut for UIAttrController.get
// definend in smx/document/UIAttrController.js

fn.UIAttrInterface = {

    /**
    *   @method ui
    */
    ui: function(key,type){

        return smx.UIAttrController.get(this,key,type);

    }


};



////////////////////////////////
// TIME INTERFACE
// 'time' attributes namespace
// definend in smx/document/TimeAttrController.js

fn.TimeInterface = {


    /**
    *   @method time
    */
    time: function(key){

        return smx.TimeAttrController.get(this,key);
    },


    /**
    *   @method synchronize
    */
    synchronize: function(){

        /*
        //get 'timing' attribute value
        var is_timed = this.time('timed');
        var is_timeline = this.time('timeline');

        //check if node need to be sync
        if (!is_timed && !is_timeline){

            this.duration=0;
            this.start=0;

            //do not use 'sync' attribute so flag it with 'is-sync'
            this[0].setAttribute('is-sync','true');

            return;
        }
        */


        //update sync values (start, duration)
        var force_sync = true;
        var duration = this.time('duration',force_sync);
        var start = this.time('start',force_sync);

        return;
    }


};



//extend smx fn methods
smx.fn = (!smx.fn)? fn : _.extend(smx.fn,fn);



})(window, window._, window.Sizzle, window.smx);
