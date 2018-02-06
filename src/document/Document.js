(function (global, smx, Sizzle) {


/**
 * SMX Document Class
 * @memberof smx
 */
class Document {
  
  /**
   * @param {XMLDocument}
   */
  constructor(xmlDocument) {
    
    //requires DOCUMENT_NODE
    if(xmlDocument.nodeType!==9)
      throw(new Error('Document constructor requires DOCUMENT_NODE'));
    
    /**
     * Original XMLDocument for reference
     * @type {XMLDocument}
     * @readonly
     */
    this[0] = xmlDocument;
    
    /**
     * Contains an id &rarr; key map of all processed nodes for easy acccess.
     * @type {Object}
     * @private
     */
    this._cache = {};
    
  }

  /**
   * Gets Uniform Resource Locator
   * Concatenation of path values from parent nodes up to document root
   * @type {String}
   * @readonly
   */
  get path() {
    var path = this[0].URL.split('/');
    path.pop(); return path.join('/');
  }

  /**
   * Gets the source file url for this document.
   * @type {String}
   * @readonly
   */
  get src() {
    return this[0].URL;
  }

  /**
   * Gets the root node.
   * @type {SMXNode}
   * @readonly
   */
  get root() {
    return this.wrap(this[0].lastChild);
  }

  /**
   * Gets the node with the given identifier.
   * @memberof smx.fn.TreeNode
   * @alias gid
   * @return {SMXNode}
   */
  getNodeById(id){
      
    //cached id?
    if(this._cache[id]) return this._cache[id];
    
    //search in document
    var xmlNode = this[0].getElementById(id);
    
    //not found
    return this.wrap(xmlNode);

  }

  gid(id){ return this.getNodeById(id) }
  
  /**
   * Finds all nodes matching the given selector.
   * @param {String} selector - search selector
   * @param {SMXNode=} context - node context to find inside
   * @return {Array.<SMXNode>}
   */
  find(selector, ctxNode) {
    
    if (!selector) return [];
    var nodes = Sizzle(selector,(ctxNode||this)[0]);
    return this.wrap(nodes);
    
  }
  
  /**
   * Wraps an existing node or nodes in smx paradigm.
   * @param {XMLNode|XMLNode[]}
   * @return {SMXNode|SMXNode[]}
   */
  wrap(s){
    
    if(!s) return;
    
    var _this = this;
    var _wrapNode = function (xmlNode) {
      
      var id;
      
      try {
          id = xmlNode.getAttribute('id');
      } catch (e) {}
        
      //id attr is required!
      if (!id) return;
      
      //ensure using the active document
      if(xmlNode.ownerDocument!==_this[0]) return;
      
      //Does already exists a node with this id?
      //prevent duplicated nodes and return existing one
      if (_this._cache[id]) return _this._cache[id];
      
      //create new Node from given XMLNode
      var node = new smx.Node(xmlNode);
      
      //reference node owner document
      node._document = _this;
      
      //adds wrapped node in cache
      _this._cache[id] = node;
      
      //return wrapped node
      return node;
      
    };
    
    var isArray = (s.constructor.name === 'Array');
    var isNodeList = (s.constructor.name === 'NodeList');
    if(isArray || isNodeList){
      //NodeList does not allow .map
      //force array so we can do the mapping
      //s = Array.prototype.slice.call(s);
      return [].map.call(s,function(n){
        return (n[0])? n : _wrapNode(n);
      });
    }
    else{
      return (s[0])? s : _wrapNode(s);
    }
    
  }


  
}

//expose
smx.Document = Document;



})(window, window.smx, window.Sizzle);