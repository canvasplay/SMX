(function(global){

  /**
   * Global runtime namespace.
   * @namespace $smx
   */
  var $smx = {};
  
  
  /**
   * Runtime nodes cache. Contains an id key map of all processed nodes for
   * easy acccess.
   * @memberof $smx
   * @type {Object}
   */
  $smx.cache = {};
  
  
  var $smxFunction = function(){
    return __node_wrapper.apply($smx, arguments);
  };


   /**
    * Global node wrapper.
    * @param {String=} selector
    * @return {Node|Nodes[]}
    */
    var __node_wrapper = function (elems) {



        var create_node = function (xmlNode) {

            var id = null;

            //if(!xmlNode) return;
            //if (xmlNode.nodeName == 'undefined') return;
            //if (typeof xmlNode.nodeType == 'undefined') return;
            //if (xmlNode.nodeType != 1) return;

            //can this try replace the 4 conditionals above? yes...
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




        if (elems && (_.isArray(elems) || !_.isUndefined(elems.length)) && _.isUndefined(elems.nodeType)) {
            var result = [];
            for (var i = 0; i < elems.length; i++) {
                if (elems[i]) {
                    var node = (elems[i][0]) ? elems[i] : create_node(elems[i]);
                    if (node) result.push(node);
                }
            }
            return result;
        } else if (elems) {
            if (elems[0]) return elems;
            else return create_node(elems);
        } else return;

    };



	//expose global
	global.$smx = $smx;


})(window);


	