(function(global, _, Sizzle, smx){


//private namespace for SMX functions
var fn = {};

/**
 * Extends SMXNode with utility attribute getters
 * @module Node/AttributeGetters
 */

fn.AttributeGetters = {

    /**
    * Get attribute value for the given key from the inner XMLNode
    * @method attr
    * @param {String} name - attribute name
    * @return {String} value
    * @example
    *
    * var users = [
    *   { 'user': 'barney',  'active': false },
    *   { 'user': 'fred',    'active': false },
    *   { 'user': 'pebbles', 'active': true }
    * ];
    *
    * _.findIndex(users, function(o) { return o.user == 'barney'; });
    * // => 0
    *
    * // The `_.matches` iteratee shorthand.
    * _.findIndex(users, { 'user': 'fred', 'active': false });
    * // => 1
    *
    * // The `_.matchesProperty` iteratee shorthand.
    * _.findIndex(users, ['active', false]);
    * // => 0
    *
    * // The `_.property` iteratee shorthand.
    * _.findIndex(users, 'active');
    * // => 2
    */
    attr:function(name){
        return this[0].getAttribute(name);
    },

    /**
    * Determine if inner XMLNode has an attribute with the given name
    * @method has
    * @param {String} name - attribute name
    * @return {Boolean}
    */
    has:function(name){
        //return this[0].hasAttribute(name);
        //IE8 does not support XMLNode.hasAttribute, so...
        return (this[0].getAttribute(name) !== null);
    },


    /**
     * Get Delimiter Separated Value
     * An utility method converts given attribute value into dsv array
     * @method dsv
     * @param name {String} the name of the attribute
     * @param delimiter {String=} delimiter string
     * @return {Array.<String>}
     */
    dsv: function(name, delimiter){

        //ignore undefined attributes
        if(!this.has(name)) return;

        //get attr's value by name
        var value = this.attr(name);

        //delimiter defaults to space
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
                    str = str.subString(0, i + 1);
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
     * Utility method, converts the given name attribute value into csv array
     * @method csv
     * @param name {String} the name of the attribute
     * @return csv array
     */

    csv: function(name){
      
      return this.dsv(name,',');
      
    }

};




/**
 * Extends SMXNode with utility attribute getters
 * @module Node/Core
 */

fn.CoreMethods = {

    /**
     * position in parent children
     * @method index
     * @param {String=} selector - css selector filter
     * @return {Integer}
     */
    'index': function(selector){

        //0 by default
        var index = 0;

        //get parent node
        var parent = this.parent();

        //no parent? its kind of root so it has no sibling nodes
        if(!parent) return index;

        //get sibling nodes
        var siblings = parent.children();

        //filter siblings collection with a css selector if its defined
        if(selector) siblings = siblings.filter(function(s){
            return Sizzle.matchesSelector(s[0],selector)
        });

        //get position in siblings collection
        index = siblings.indexOf(this);

        return index;

    },

    /**
     * get String representation of a node
     * @method toString
     * @return {String}
     */
    toString: function(){

        //this looks better in console
        return this.name + '#' + this.id;

    },

    /**
     * get node's text contents
     * @method text
     * @return {String}
     */
    text: function(){
        return this[0].text || this[0].textContent || '';
    },
    
    /**
     * get node's html content
     * @method getInnerHTML
     * @return {String}
     */
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
    
    /**
     * get JSON representation of a node
     * @method toJSON
     * @return {Object}
     */
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

            for(var c=0; c<childs.length;c++){

                json.children.push(childs[c].toJSON());

            }

        }


        return json;
    }





};



/**
 *  REL ATTRIBUTES INTERFACE
 *
 *  Plugin Method for attributes namespaced with 'rel'
 *  rel attributes may indicate the id of a somehow related node
 *
 */

/**
 * Relations Methods
 * @module Node/Rel
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

/**
 * UserInterface Methods
 * @module Node/UI
 */


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

/**
 * Time Interface Methods
 * @module Node/Time
 */
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
