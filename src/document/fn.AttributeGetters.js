(function(global, Sizzle, smx){

/**
 * Extends SMXNode with utility attribute getters
 * @namespace AttributeGetters
 * @memberof smx.fn
 */

let AttributeGetters = {

    /**
    * Gets the value for the given name attribute
    * @method attr
    * @memberof smx.fn.AttributeGetters
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
    * Checks if node has or not an attribute with the given name
    * @method has
    * @memberof smx.fn.AttributeGetters
    * @param {String} name - attribute name
    * @return {Boolean}
    */
    has:function(name){
        //return this[0].hasAttribute(name);
        //IE8 does not support XMLNode.hasAttribute, so...
        return (this[0].getAttribute(name) !== null);
    },


    /**
     * Gets Delimiter Separated Value
     * An utility method converts given attribute value into dsv array
     * @method dsv
     * @memberof smx.fn.AttributeGetters
     * @param name {String} the name of the attribute
     * @param delimiter {String=} delimiter string
     * @return {Array.<String>}
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

//extend smx fn methods
smx.fn = (!smx.fn) ? { AttributeGetters } : Object.assign(smx.fn, { AttributeGetters });


})(window, window.Sizzle, window.smx);
