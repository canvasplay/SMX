(function (global, smx) {

/**
 * SMX Node Class
 * @memberof smx
 * @mixes smx.fn.Core
 */
class Node {

    /**
     * @param {XMLNode} xmlNode
     */
    constructor(xmlNode) {
        /**
         * Original XMLNode for reference
         * @type {XMLNode}
         * @readonly
         */
        this[0] = xmlNode;
    }

    /**
     * Direct access to XMLNode.id
     * @type {String}
     * @readonly
     */
    get id() {
        return this[0].id;
    }

    /**
     * Direct access to XMLNode name
     * @type {String}
     * @readonly
     */
    get name() {
        return this[0].nodeName;
    }

    /**
     * Gets node name based on inner XMLNode.nodeName, 
     * default is `smx`, posible values are `txt`, `md`, `html`, ...
     * @type {String}
     * @readonly
     */
    get type() {
        return this[0].getAttribute('type') || 'smx';
    }

    /**
     * Gets node className based on inner XMLNode class attribute
     * @type {String}
     * @readonly
     */
    get className() {
        return this[0].getAttribute('class');
    }


    /**
     * Gets browser url hash
     * @type {String}
     * @readonly
     */
    get hash() {
        return '#!/' + this.uri;
    }


    /**
     * Gets Uniform Resource Identifier.
     * Concatenation of id values from parent nodes up to root
     * @type {String}
     * @readonly
     */
    get uri() {
        let hash = this.id + '/';
        let parent = this.parent();
        if (parent) return parent.uri + hash;
        else return hash;
    }


    /**
     * Gets Uniform Resource Locator
     * Concatenation of path values from parent nodes up to root
     * @type {String}
     * @readonly
     */
    get url() {
        //'one / two // three ///'.replace(/\/\/+/g, '/')
        let path = this.attr('path');
        let parent = this.parent();
        if (parent) {
            if (!path)
                return parent.url;
            else {
                //add trail slash
                let trail = path.substr(-1);
                if (trail != '/') path += '/';
                return parent.url + path;
            }
        } else {
            if (!path) return;
            //add trail slash
            let trail = path.substr(-1);
            if (trail != '/') path += '/';
            return path;
        }
    }


    /**
     * Gets source file url for this node
     * @type {String}
     * @readonly
     */
    get src() {
        
        var result = '';
        let file = this.attr('file');
        let parent = this.parent();

        if (!file)
            result = (parent) ? parent.file : undefined;
        else
            result = this.url + file;

        if (result) result = result.replace(/\/\/+/g, '/');

        return result;

    }

}



//extend Node prototype

for (var key in smx.fn){
    Object.assign(Node.prototype, smx.fn[key]);
}

//expose
smx.Node = Node;


})(window, window.smx);