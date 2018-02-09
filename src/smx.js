(function(global){

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
   * This namescape is a placeholder for custom attribute parsers.
   * Attribute parsers are used during XML transpilation to process original
   * nodes attributes in different ways.
   * @namespace AttributeParsers
   * @memberof smx
   */
  smx.AttributeParsers = [];


  /**
   * This namescape is a placeholder for custom node parsers.
   * Tag parsers are used during XML transpilation to transform original nodes
   * in different ways.
   * @namespace NodeParsers
   * @memberof smx
   */
  smx.NodeParsers = [];
  

  /**
  * Global node wrapper.
  * @param {String|SMXNode|SMXNode[]} s - selector, node or node collection
  * @return {SMXNode|SMXNodes[]}
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

  
  //expose globals
	global.smx = smx;

})(window);