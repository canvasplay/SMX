/**
 * Extends {@link smx.Node Node} with utility attribute getters.
 * @mixin Node-Attributes
 * @see smx.Node
 */

let NodeAttributes = {

    /**
     * Gets the value for the given attribute name.
     *
     * @memberof Node-Attributes
     * @param {String} name - attribute name
     * @return {String} value
     * @example
     * //<movie tags="sci-fi, horror, adventures" />
     * $movie.attr('tags')
     * // => "sci-fi, horror, adventures"
     */
    attr:function(name){
        
        return (this[0].getAttribute)? this[0].getAttribute(name) : undefined;
        
    },

    /**
     * This method is like `attr` but will use an attribute parser if there is
     * one predefined for the given attribute name.
     *
     * @memberof Node-Attributes
     * @param {String} name - attribute name
     * @param {Object=} opt - options to pass into attribute parser
     * @return {String} value
     */
    get: function(name, opt){
        
        if(!this[0].getAttribute) return undefined;
        
        //get an existing attribute parser for the given name
        var parser = smx.AttributeParsers[name];
        
        //no parser? return the raw attribute
        if(!parser) return this.attr(name);
        
        //else use the parser with the given options
        else return parser(name, opt);
        
    },


    /**
     * Checks if node has or not an attribute with the given name
     * @method has
     * @memberof Node-Attributes
     * @param {String} name - attribute name
     * @return {Boolean}
     */
    has: function(name){
      if(!this[0].getAttribute) return false;
      //return this[0].hasAttribute(name);
      //IE8 does not support XMLNode.hasAttribute, so...
      return (this[0].getAttribute(name) !== null);
    },


    /**
     * Gets Delimiter Separated Value
     * An utility method converts given attribute value into dsv array
     * @method dsv
     * @memberof Node-Attributes
     * @param name {String} the name of the attribute
     * @param delimiter {String=} delimiter string
     * @return {Array.<String>}
     * @example
     * //<movie tags="sci-fi, horror, adventures">
     * $movie.dsv('tags',',')
     * // => ["sci-fi", "horror", "adventures"]
     */
    dsv: function(name, delimiter){

        //ignore undefined attributes
        if(!this.has(name)) return;

        //get attr's value by name
        var value = this.attr(name);

        //resolve delimiter, defaults to space
        var d = delimiter || ' ';

        //if attribute exists value must be String
        if (typeof value != 'string') return [];

        //split value by delimiter
        var list = value.split(delimiter);

        //trim spaces nicely handling multiple spaced values
        list = list.map(function(str){

            //convert multiple spaces, tabs, newlines, etc, to single spaces
            str = str.replace(/^\s+/, '');

            //trim leading and trailing whitespaces
            str = str.replace(/(^\s+|\s+$)/g, '');

            return str;

        });

        //remove empty like values
        list = list.filter(function(str){
            return ( value !== '' && value !== ' ' );
        });

        return list;

    }


};

export default NodeAttributes;