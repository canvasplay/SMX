(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with core methods
 * @mixin Core
 * @memberof smx.fn
 */

let Core = {

    /**
     * Gets index position in matching sibling nodes
     * @method getIndex
     * @memberof smx.fn.Core
     * @param {String=} selector - css selector filter
     * @return {Integer}
     */
    getIndex: function(selector){

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
     * get node's text contents
     * @method getText
     * @memberof smx.fn.Core
     * @return {String}
     */
    getText: function(){
        return this[0].text || this[0].textContent || '';
    },
    
    /**
     * get node's html content
     * @method getHTML
     * @memberof smx.fn.Core
     * @return {String}
     */
    getHTML: function(){

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
     * get String representation of a node
     * @method toString
     * @memberof smx.fn.Core
     * @return {String}
     */
    toString: function () {
        return `
            <${this.name} id="${this.id}">
        `.trim();
    },

    /**
     * get JSON representation of a node
     * @method toJSON
     * @memberof smx.fn.Core
     * @return {Object}
     */
    toJSON: function(){
        return {}; //not implemented :(
    }



};

//extends smx fn methods
smx.fn = (!smx.fn) ? { Core } : Object.assign(smx.fn, { Core });



})(window, window._, window.Sizzle, window.smx);
