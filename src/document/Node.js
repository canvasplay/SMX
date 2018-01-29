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
     * Concatenation of id values from parent nodes up to document root
     * @type {String}
     * @readonly
     */
    get uri() {
        let hash = this.id + '/';
        if (this.parent) return this.parent.uri + hash;
        else return hash;
    }


    /**
     * Gets Uniform Resource Locator
     * Concatenation of path values from parent nodes up to document root
     * @type {String}
     * @readonly
     */
    get url() {
      let path = this.attr('path');
      if (this.parent) {
        if (!path)
          return this.parent.url;
        else {
          //add trail slash
          let trail = path.substr(-1);
          if (trail != '/') path += '/';
          return this.parent.url + path;
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

        if (!file)
            result = (this.parent) ? this.parent.file : undefined;
        else
            result = this.url + file;

        if (result) result = result.replace(/\/\/+/g, '/');

        return result;

    }
    
    
    /**
     * Direct access to XMLNode.ownerDocument
     * @type {XMLDocument}
     * @readonly
     */
    get document() {
      return this[0].ownerDocument;
    }
    
    /**
     * Gets parent node
     * @type {SMXNode}
     * @readonly
     */
    get parent() {
      return $smx(this[0].parentNode);
    }

    /**
     * Gets ancestors nodes
     * @type {SMXNode[]}
     * @readonly
     */
    get ancestors() {
      var a = [];
      var p = this;
      while(p.parent){
        p = p.parent;
        a.push(p);
      }
      return a;
    }
    
    
    /**
     * Gets root node
     * @type {SMXNode}
     * @readonly
     */
    get root() {
      return this.ancestors[0];
    }

    /**
     * Gets children nodes
     * @type {SMXNode[]}
     * @readonly
     */
    get children() {
      //non smx nodes should have no children
      if(this.type!=='smx') return [];
      return $smx(this[0].childNodes);
    }

    /**
     * Gets first child node
     * @type {SMXNode}
     * @readonly
     */
    get first() {
      return this.children.shift();
    }

    /**
     * Gets last child node
     * @type {SMXNode}
     * @readonly
     */
    get last() {
      return this.children.pop();
    }

    
    /**
     * Gets previous sibling node
     * @type {SMXNode}
     * @readonly
     */
    get previous(){
      return $smx(this[0].previousElementSibling || this[0].previousSibling);
    }
    
    /**
     * Gets next sibling node
     * @type {SMXNode}
     * @readonly
     */
    get next(){
      return $smx(this[0].nextElementSibling || this[0].nextSibling);
    }

}


//Object.defineProperty(Node.prototype, 'duration', { get: function() { return this.time('duration'); } });

//extend Node prototype

for (var key in smx.fn){
    Object.assign(Node.prototype, smx.fn[key]);
}

//expose
smx.Node = Node;


})(window, window.smx);