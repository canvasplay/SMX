(function (global, smx) {

/**
 * SMX Node Class
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
     * Browser url hash for this node
     * @type {String}
     * @readonly
     */
    get hash() {
        return '#!/' + this.uri;
    }

    /**
     * Uniform Resource Locator (url path)
     * Calculate url folder path using cummulative paths up to root
     * @type {String}
     * @readonly
     */

    get url() {

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
     * url of xml source file of this node
     * @type {String}
     * @readonly
     */

    get file() {

        let url = '';
        let file = this.attr('file');
        let parent = this.parent();

        if (!file)
            return (parent) ? parent.file : undefined;

        else
            return this.url + file;

    }



}

//extend Node prototype

for (var key in smx.fn) {

    //_.extend(Node.prototype,fns);
    Object.assign(Node.prototype, smx.fn[key]);

}

//expose
smx.Node = Node;


})(window, window.smx);