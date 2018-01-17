(function (global, smx) {

/**
 * SMX Node Class
 * @memberof smx
 */
class Node {

    /**
     * @param {XMLNode} xmlNode
     */
    constructor(xmlNode) {
        /**
         * Original XMLNode for reference
         * @type {XMLNode}
         * @protected
         */
        this[0] = xmlNode;
    }

    /**
     * Direct access to XMLNode id
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
     * node type with 'smx' as default, it can also be txt, md, html, ...
     * @type {String}
     * @readonly
     */
    get type() {
        return this[0].getAttribute('type') || 'smx';
    }

    /**
     * class attribute as array of
     * @type {String}
     * @readonly
     */
    get className() {
        return this[0].getAttribute('class');
    }


    /**
     * Browser url hash for this node
     * @type {String}
     * @readonly
     */
    get hash() {
        return '#!/' + this.uri;
    }


    /**
     * Uniform Resource Identifier,"url id"
     * Calculate url hash path using cummulative ids up to root
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
     * Uniform Resource Locator (url path)
     * Calculate url folder path using cummulative paths up to root
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
     * Gets the node's source file url
     * @type {String}
     * @readonly
     */

    get file() {

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

    /** @lends smx.fn.Core.text */

}



//extend Node prototype

for (var key in smx.fn){
    Object.assign(Node.prototype, smx.fn[key]);
}

//expose
smx.Node = Node;


})(window, window.smx);