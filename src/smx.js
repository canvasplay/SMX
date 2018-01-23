(function(global){

  /**
   * Global namespace to hold all framework classes and modules.
   * @namespace smx
   */
	var smx = {};
	
	
  /**
   * Gets current framework version
   * @memberof smx
   * @type {String}
   */
	smx.version = '0.8.14';
  
  
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
  
  
  
  //expose globals
	global.smx = smx;

})(window);