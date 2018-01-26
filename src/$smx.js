(function(global){

  /**
   * Global runtime object
   * @namespace $smx
   */
  var $smx = function(){
    return __node_wrapper.apply($smx, arguments);
  };
  
  
  /**
   * Contains an id key map of all processed nodes for easy acccess.
   * @memberof $smx
   * @type {Object}
   */
  $smx.cache = {};
  
  
  /**
   * Runtime Document instance
   * @memberof $smx
   * @type {smx.Document}
   */
  $smx.document = null;
  


 /**
  * Global node wrapper.
  * @param {String=} selector
  * @return {String|Node|Nodes[]}
  */
  var __node_wrapper = function(s){

      //no arguments? do nothing...
      if(!s) return;
      
      /*
      
        HOW TO INITIALIZE $smx.document???
        
        //require document instance
        if($smx.document) return;
        
        //if string should be a selector
        if(typeof s === 'string')
          return $smx.document.find(s);
          
      */
      
      var create_node = function (xmlNode) {

          var id;

          try {
              id = xmlNode.getAttribute('id')
          } catch (e) {}

          //id attr is required!
          if (!id) return;

          //Does already exists a node with this id?
          //prevent duplicated nodes and return existing one
          if ($smx.cache[id]) return $smx.cache[id];

          //create new Node from given XMLNode
          var node = new smx.Node(xmlNode);

          //add it to nodes cache
          $smx.cache[id] = node;

          //return just created node
          return node;

      };


      var isArray = (s.constructor.name === 'Array');
      var isNodeList = (s.constructor.name === 'NodeList');
      if(isArray || isNodeList){
        //NodeList does not allow .map
        //force array so we can do the mapping
        s = Array.prototype.slice.call(s);
        return s.map(function(n){
          return create_node(n);
        });
      }
      else{
        return create_node(s);
      }

  };



	//expose global
	global.$smx = $smx;


})(window);


	