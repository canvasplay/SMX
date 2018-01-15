(function(global, _, Sizzle, smx){


//private namespace for SMX functions
var fn = {};

/**
 * Extends SMXNode with utility attribute getters
 * @module fn/core
 */

fn.AttributeGetters = {


    /**
    * Get the raw value for specified attribute key in the original xml node
    * @method raw
    * @param {String} key - The name of the attribute
    * @return {String} resulting value
    * @memberof AttributeGetters
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

        /*
        //key is required to be non empty string
        if(_.isEmpty(key) || !_.isString(key)) return;

        //try using defined attribute getter
        var getter = smx.fn.ComputedAttributes[key];
        if(_.isFunction(getter)) return getter(this,options);
        */

        //use default attr getter
        return this.attr(key);

    },


    /**
     *  Delimiter Separated Value
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

    /**
     *  @method index
     *  position in parent children
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
        if(selector) siblings = siblings.filter(function(s){ return Sizzle.matchesSelector(s[0],selector) });

        //get position in siblings collection
        index = siblings.indexOf(this);

        return index;

    },

    //return serialization of original XML node
    toString: function(){

        //this looks better in console
        return this.name + '#' + this.id;

    },

    //return serialization of original XML node
    text: function(){
        return this[0].text || this[0].textContent || '';
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
