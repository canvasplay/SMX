(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with core methods
 * @namespace Core
 * @memberof smx.fn
 */

let Core = {

    /**
     * Gets index position in matching sibling nodes
     * @method index
     * @memberof smx.fn.Core
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
     * @memberof smx.fn.Core
     * @return {String}
     */
    toString: function(){

        //this looks better in console
        return this.name + '#' + this.id;

    },

    /**
     * get node's text contents
     * @method text
     * @memberof smx.fn.Core
     * @return {String}
     */
    text: function(){
        return this[0].text || this[0].textContent || '';
    },
    
    /**
     * get node's html content
     * @method getInnerHTML
     * @memberof smx.fn.Core
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
     * @memberof smx.fn.Core
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

//extends smx fn methods
smx.fn = (!smx.fn) ? { Core } : Object.assign(smx.fn, { Core });



})(window, window._, window.Sizzle, window.smx);
