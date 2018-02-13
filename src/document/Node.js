(function (global, smx) {

/**
 * SMX Node Class
 * @memberof smx
 * @mixes smx.fn.Core
 * @mixes smx.fn.TreeNode
 */
class Node {

  /**
   * @param {XMLNode} xmlNode
   */
  constructor(xmlNode) {
      
      //require nodeType === 1 --> Node.ELEMENT_NODE
      if(xmlNode.nodeType!==1)
        throw(new Error('Node constructor requires ELEMENT_NODE'));
        
      /**
       * Original XMLNode for reference
       * @type {XMLNode}
       * @protected
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
    if(this[0].getAttribute)
      return this[0].getAttribute('type') || 'smx';
    else
      return 'smx';
  }

  /**
   * Gets node className based on inner XMLNode class attribute
   * @type {String}
   * @readonly
   */
  get className() {
    if(this[0].getAttribute)
      return this[0].getAttribute('class');
    else
      return '';
  }
  
  /**
   * Gets the owner SMXDoxument
   * @type {SMXDocument}
   * @readonly
   */
  get document() {
      return this._document;
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
    
    let path = this[0].getAttribute('path');
    var result;
    if (this.parent) {
      if (!path)
        result = this.parent.url;
      else {
        //add trail slash
        let trail = path.substr(-1);
        if (trail != '/') path += '/';
        result = this.parent.url + path;
      }
    } else {
      if (path){
        //add trail slash
        let trail = path.substr(-1);
        if (trail != '/') path += '/';
        result = path;
      }
    }
    
    //remove double slashes
    if (result) result = result.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
    
    return result;
    
  }


  /**
   * Gets source file url for this node
   * @type {String}
   * @readonly
   */
  get src() {
    
    var result = '';
    let file = this[0].getAttribute('file');
    
    if (!file)
      result = (this.parent) ? this.parent.src : undefined;
    else
      result = this.url + file;
    
    //remove double slashes
    if (result) result = result.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
    
    return result;
    
  }
  
  
  /**
   * Gets parent node
   * @type {SMXNode}
   * @readonly
   */
  get parent() {
    return this.document.wrap(this[0].parentNode);
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
    return this.ancestors[0] || this;
  }

  /**
   * Gets children nodes
   * @type {SMXNode[]}
   * @readonly
   */
  get children() {
    //non smx nodes should have no children
    if(this.type!=='smx') return [];
    else return this.document.wrap(this[0].childNodes);
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
    return this.document.wrap(this[0].previousElementSibling || this[0].previousSibling);
  }
  
  /**
   * Gets next sibling node
   * @type {SMXNode}
   * @readonly
   */
  get next(){
    return this.document.wrap(this[0].nextElementSibling || this[0].nextSibling);
  }

}

//inline property getter definition
//Object.defineProperty(Node.prototype, 'duration', { get: function() { return this.time('duration'); } });

//extends Node prototype
Object.assign(Node.prototype, smx.fn);

//expose
smx.Node = Node;


})(window, window.smx);