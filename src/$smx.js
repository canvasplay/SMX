(function(global){

/**
 * Global smx runtime object.
 * @namespace $smx
 */
var $smx = function(){
  return _smx_wrapper.apply($smx, arguments);
};

/**
 * Currently active document.
 * @memberof $smx
 * @type {SMXDocument}
 */
$smx.document = null;

/**
 * Array of loaded documents.
 * @memberof $smx
 * @type {SMXDocument[]}
 */
$smx.documents = [];
  

/**
* Global node wrapper.
* @name $smx
* @param {String|SMXNode|SMXNode[]} s - selector, node or node collection
* @return {SMXNode|SMXNodes[]}
*/
var _smx_wrapper = function(s){

  //require an active document
  if(!$smx.document) return;
  
  //no arguments? do nothing...
  if(!s) return;
    
  //string? should be a selector search
  if(typeof s === 'string'){
    
    //require an active document instance
    if(!$smx.document) return [];
    
    //use given selector to find in active document
    return $smx.document.find(s);
    
  }
  
  return $smx.document.wrap(s);

};

//expose global
global.$smx = $smx;


})(window);


	