import smxLoad from './smx.load.js';

/**
 * Global namespace to hold all framework classes and modules.
 * @namespace smx
 */
var smx = function(){
  return _smx_wrapper.apply(smx, arguments);
};

/**
 * Gets current framework version
 * @memberof smx
 * @type {String}
 */
smx.version = '0.8.14';


/**
 * Currently active document.
 * @memberof smx
 * @type {SMXDocument}
 */
smx.document = null;

/**
 * Array of loaded documents.
 * @memberof smx
 * @type {SMXDocument[]}
 */
smx.documents = [];


/**
 * Namespace for SMXNode extended mixin methods.
 * @memberof smx
 * @type {Object}
 */
smx.fn = {};


smx.parsers = [];

/**
 * Namescape for custom attribute parsers.
 * Attribute parsers are used during XML transpilation to process original
 * nodes attributes in different ways.
 * @memberof smx
 * @type {Array}
 */
smx.AttributeParsers = [];


/**
 * Namespace for custom node parsers.
 * Tag parsers are used during XML transpilation to transform original nodes
 * in different ways.
 * @memberof smx
 * @type {Array}
 */
smx.NodeParsers = [];


/**
* Global node wrapper.
* @method smx
* @param {String|SMXNode|SMXNode[]} s - selector, node or node collection
* @return {SMXNode|SMXNodes[]}
* @memberof smx
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
