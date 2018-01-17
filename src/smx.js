/**
*	SMX Synchronized Multimedia XML
*	@namespace smx
*
*/


(function(global){


	var smx = {};

	smx.version = '0.8.14';


  
  smx.cache = {};
  
  smx.document = null;
  smx.documents = [];




    //declare and expose $smx namespace
    var $smx = global['$smx'] = {};



    ////////////////////////////////
    // PRIVATE INDEXED NODE LIST CACHE

    $smx.cache = {};


    ////////////////////////////////
    // SMX NODE WRAPPER

    $smx.node = function (elems) {



        var _Node = function (xmlNode) {

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
                    var node = (elems[i][0]) ? elems[i] : _Node(elems[i]);
                    if (node) result.push(node);
                }
            }
            return result;
        } else if (elems) {
            if (elems[0]) return elems;
            else return _Node(elems);
        } else return;

    };



	//expose
	global.smx = smx;


})(window);


	