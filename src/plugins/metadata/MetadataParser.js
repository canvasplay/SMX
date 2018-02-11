/**
 * SMX Metadata Parser
 * @module MetadataParser
 */

((global, Sizzle, smx, LOG)=>{


//local helper
var escapeHtml = function(html){
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return html.replace(/[&<>"']/g,(m)=>map[m]);
};

/**
 * @memberof MetadataParser
 * @param {XMLDocument} xml
 * @param {Object} options
 * @static
 */
var parseXML = function(xml, opt){

    var XML = xml;

    //validate XML
    if(!XML) return;

    //normalize options
    var options = _.extend({
        data: {},
        callback: function(){ return },
        total: 0,
        nodes: null,
        max_iterations: 25
    },opt);


    // get all unparsed nodes based on flag attr
    // `metadata-processed` attribute is added while parsing process
    // nodes missing the flag attr are the nodes we need to parse
    var nodes;
    if(!options.nodes){
      //using Sizzle.selectors.filters.meta.js
      var selector = ['metadata,:meta'];
      nodes = Sizzle(selector.join(''), XML);
      //include root node itself to the list
      //nodes.unshift(XML);
    }
    else nodes = options.nodes;

    //calculate percent progress
    if(nodes.length > options.total) options.total = nodes.length;
    var percent =  Math.floor(100 - (nodes.length*100) / options.total);


    LOG('METADATA PARSING... ('+ (options.total-nodes.length) +'/'+ options.total +') '+percent+'%');


    var i = 0;

    while(nodes.length && i<options.max_iterations){

        var node = nodes.shift();

        var result;

        if(node.nodeType==1){

            result = (node.nodeName == 'metadata' )? parseMetadataNode(node) : parseMetaAttributes(node);

            if(result){

                //create node data object if does not exists yet
                if (!options.data[result.id]) options.data[result.id] = {};

                //extend parent data object
                if(!_.isEmpty(result.data)) _.extend(options.data[result.id], result.data);

            }

        }


        i++;

    }


    //more nodes to parse?
    if(nodes.length){

        _.delay(_.bind(function(){ parseXML(XML,{
            data: options.data,
            callback: options.callback,
            total: options.total,
            nodes: nodes
        }) },this),0);

    }
    //complete! no more nodes to parse
    else{

        //remove all existing metadata-processed attributes
        //LOG('METADATA REMOVING FLAGS...' );
        var flagged_nodes = Sizzle('[metadata-processed]', XML);
        _.each(flagged_nodes,function(node){
            node.removeAttribute('metadata-processed');
        });

        LOG('METADATA COMPLETE!   ('+ options.total +'/'+ options.total +') 100%' );

        try{
            
            options.callback(XML,options.data);

        }catch(e){

            LOG('METADATA CALLBACK ERROR! '+ e.toString() );
        }
    }


    return;
};


/**
 * @memberof MetadataParser
 * @param {XMLNode} node
 * @static
 */

var parseMetadataNode = function(node){

    //metadata node is required...
    if(!node || node.nodeName!=='metadata') return;

    //get direct metadata parent node
    var parent = node.parentNode;

    //no parent node? wtf!!
    if(!parent) return;

    //node id which to attach data parsed
    var id = parent.getAttribute('id');

    //instance returning data object
    var data = {};


    //get and remove metadata node from parent
    var md = parent.removeChild(node);

    for (var c =0; c<md.childNodes.length; c++){

        var xmlNode = md.childNodes[c];

        var key = xmlNode.nodeName;

        var value;

        if (xmlNode.innerHTML){

            //is <![CDATA ???
            var is_cdata = ( (xmlNode.innerHTML+'').indexOf('<![CDATA') >= 0 );

            if(is_cdata){

                var _chilNodes = xmlNode.childNodes;

                var _cdata, i=0;

                while(!_cdata && i<_chilNodes.length){

                    var _node = _chilNodes[i];

                    if(_node && _node.nodeType === 4 ) _cdata = _node;

                    i++
                }

                if(_node)   value = escapeHtml(_cdata.textContent+'');
                else        value = xmlNode.innerHTML;

            }
            else{

                value = xmlNode.innerHTML;
                                
                //trim unwanted trailing and leading whitespace
                value = (value+'').replace(/^\s+|\s+$/gm,'');


            }

        }
        else{

            var childs = xmlNode.childNodes;

            var str = '';

            if (childs.length){
                _.each(childs,function(item,index){
                    str+= item.xml || (new XMLSerializer()).serializeToString(item);
                });
            }

            value = str;
            
            //trim unwanted trailing and leading whitespace
            value = (value+'').replace(/^\s+|\s+$/gm,'');

        }

        //ignore text nodes, comment nodes, ...
        if(xmlNode.nodeType==1) data[key] = value;

    }


    return {
        'data': data,
        'id': id
    }

    
}

/**
 * @memberof MetadataParser
 * @param {XMLNode} node
 * @static
 */

var parseMetaAttributes = function(node){

    if(!node) return;

    //instance the resultant data object
    var data = {};

    //node id which to attach data parsed
    var id = node.getAttribute('id');

    //get data from node attributes
    var attrs = node.attributes;

    var names = _.map(attrs,'name');
    var values = _.map(attrs,'value');

    var len = attrs.length;

    for(var i = 0; i < len; i++) {
        var name = names[i];
        var value = values[i];
        if(name.indexOf("meta-") == 0){
          
            //remove meta- preffix
            name = name.substr(5);
            
            //trim unwanted trailing and leading whitespace
            value = (value+'').replace(/^\s+|\s+$/gm,'');
            
            //set new data entry
            data[name] = value;

            //remove the attribute
            node.removeAttribute("meta-"+name);
        }
            
    }


    //flag node with "metadata-processed" attr
    node.setAttribute('metadata-processed','true');


    return {
        'data': data,
        'id': id
    }
    

   
}


smx.meta = {
  parseXML: parseXML,
  parseMetadataNode: parseMetadataNode,
  parseMetaAttributes: parseMetaAttributes
}
  
})(window, window.Sizzle, window.smx, window.log);