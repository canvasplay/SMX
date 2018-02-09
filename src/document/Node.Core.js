(function(global, _, Sizzle, smx){

/**
 * Extends SMXNode with core methods
 * @mixin Node-Core
 */

let Core = {

    /**
     * Gets the index position in parent's children. If node has no parent,
     * will return 0. When using the optional parameter `selector`, the
     * resultant index is calculated based only in the sibling nodes matching
     * the given selector, if node does not match the selector itself will
     * return -1.
     *
     * @memberof Node-Core
     * @param {String=} selector - filter selector
     * @return {Integer}
     */
    getIndex: function(selector){
        
        //0 by default
        var index = 0;

        //no parent? its kind of root so it has no sibling nodes
        if(!this.parent) return index;
        
        //get sibling nodes
        var siblings = this.parent.children;
        
        //filter siblings collection with a css selector if its defined
        if(selector) siblings = siblings.filter(function(s){
            return Sizzle.matchesSelector(s[0],selector)
        });
        
        //get position in siblings collection
        index = siblings.indexOf(this);
        
        return index;
        
    },

    /**
     * Gets the text content.
     *
     * @memberof Node-Core
     * @return {String}
     */
    getText: function(){
        
        return this[0].text || this[0].textContent || '';
        
    },
    
    /**
     * Gets the html content.
     *
     * @memberof Node-Core
     * @return {String}
     */
    getHTML: function(){
        
        //get raw children XMLNodes
        let children = this[0].childNodes;
        
        //defaults to empty string
        var str = '';
        
        for(var i=0, len=children.length; i<len; i++)
            str+= children[i].xml || (new XMLSerializer()).serializeToString(children[i]);
            
        return str;
        
    },
    
    /**
     * Gets the inner data content formatted according to node type.
     *
     * @memberof Node-Core
     * @return {String}
     */
    getData: function(){
        
        //get raw text data
        var data = this.getText();
        
        //get data type
        var type = this.type;
        switch(this.type){
          case 'json':
              try{ data = JSON.parse(data) }
              catch(e){}
            break;
            default:
            break;
        }
        
        return data;
        
    },


    /**
     * Gets the string representation.
     *
     * @memberof Node-Core
     * @return {String}
     */
    toString: function (){
        
        return `<${this.name} id="${this.id}">`.trim();
        
    },

    /**
     * Gets the JSON representation. NOT IMPLEMENTED
     * @method toJSON
     * @memberof Node-Core
     * @return {Object}
     */
    toJSON: function(){
        return {}; //not implemented...
    }

};

//extends smx fn methods
smx.fn = (!smx.fn) ? { Core } : Object.assign(smx.fn, { Core });



})(window, window._, window.Sizzle, window.smx);
