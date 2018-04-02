import smxLoad from './smx.load.js';

/**
 * @namespace smx
 * @version 2.1
 * @desc
 * Global `smx` namespace, one namespace to hold the whole framework.
 *
 * The smx namespace can serves also as namespace function, see {@link smx.smx smx()}.
 */
var smx = function(){
  return _smx_wrapper.apply(smx, arguments);
};

/**
 * Gets current framework version.
 * @memberof smx
 * @type {String}
 * @protected
 */
smx.version = '0.8.14';


/**
 * Current active document.
 * @memberof smx
 * @type {smx.Document}
 * @protected
 */
smx.document = null;


/**
 * Array of loaded documents.
 * @memberof smx
 * @type {smx.Document[]}
 * @protected
 */
smx.documents = [];


/**
 * Namescape for custom modules, may extend smx core Classes and provide
 * new processing layers to be applied during the XML loading process.
 * This array is protected and should be controlled only be the registerModule method.
 * @memberof smx
 * @type {Array}
 * @protected
 */
smx.modules = [];

/**
 * Registers a new module. Will add it to modules collection and will also
 * extend smx core classes if the module defines any extension.
 */
smx.registerModule = function(m){
  
  //dumb check...
  if(!m) return;
  
  //add it to modules collection
  this.modules.push(m);
  
  //register process function
  if(m.process)
    smx.processors.push(m.process);
  
  //extend SMXNode
  if(m.Node)
    Object.assign(smx.Node.prototype, m.Node);
  
  //extend SMXDocument
  if(m.Document)
    Object.assign(smx.Document.prototype, m.Document);
  
  //return the registerd module as success
  return m;
  
}

/**
* @method smx
* @param {String|smx.Node|smx.Node[]} [s]
* @return {smx.Node|smx.Nodes[]}
* @memberof smx
* @static
* @desc
* Global node wrapper, an useful shortcut for interacting with the current
* active document.
*
* Notice that this method is a namespace function, is private inner function
* attached directly onto smx namespace. Dont try to call this function as a
* namespace member, use the `smx` namespace itself as a function.
*
* If the required parameter is a CSS selector string will return a collection
* of {@link smx.Node Nodes} matching the given selector as a result of calling
* {@link smx.Document#find Document.find} on the current active document.
*
* If the paramater is single or array of XMLNode will return the input nodes
* wrapped as smx Nodes.
* Additionally if input are already smx Nodes will return already cached Nodes,
* so don't be afraid about rewraping nodes using this wrapper.
*
* @example
* //use it as a namespace function.
* smx('library > book');
* // => [SMXNode, SMXNode, SMXNode, ...]
*
* //not like this
* smx.smx('library > book');
* // => Error: smx.smx is not a Function.
*/
var _smx_wrapper = function(s){

  //require an active document
  if(!smx.document) return;
  
  //no arguments? do nothing...
  if(!s) return;
    
  //string? should be a selector search
  if(typeof s === 'string'){
    
    //require an active document instance
    if(!smx.document) return [];
    
    //use given selector to find in active document
    return smx.document.find(s);
    
  }
  
  return smx.document.wrap(s);

};

smx.load = smxLoad;

export default smx;
