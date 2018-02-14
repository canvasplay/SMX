import Sizzle from 'sizzle';

/**
 * SMX Taxonomy Parser
 * @module TaxonomyParser
 * @memberof module:Taxonomy
 */

/*

CONCEPT...

CATEGORIES
Categories are meant for broad grouping of nodes.
Think of these as general topics or the table of contents
Categories are hierarchical, so you can sub-categories.

TAGS
Tags are meant to describe specific nodes' details.
Think of these as your document’s index words.
They are the micro-data to micro-categorize nodes.
Tags are not hierarchical.

*/

/**
 * Parses the given XMLDocument
 * @param {XMLNode} xmlDocument
 * @param {Object} options
 * @async
 */
var parseXML = function(xmlDocument, opt){

    //xmlDocument required!
    if(!xmlDocument) return;

    //normalize options
    var options = _.extend({
        data: {},
        callback: function(){ return },
        total: 0,
        nodes: null
    },opt);


    // get all unparsed nodes based on flag attr
    // `taxonomy-processed` attribute is added while parsing process
    // nodes missing the flag attr are the nodes we need to parse
    var nodes;
    if(!options.nodes) nodes = Sizzle('[categories]:not([taxonomy-processed])', xmlDocument);
    else nodes = options.nodes;


    //calculate percent progress
    if(nodes.length > options.total) options.total = nodes.length;
    var percent =  100- parseInt((nodes.length*100) / options.total);


    log('PARSING... ('+ (options.total-nodes.length) +'/'+ options.total +') '+percent+'%');


    var max_iterations = 100;
    var i = 0;

    while(nodes.length && i<max_iterations){

        var node = nodes.shift();

        var result = this.parseXMLNode(node);

        if(result){

            //create node data object if does not exists yet
            if (!options.data[result.id]) options.data[result.id] = {};

            //extend parent data object
            if(!_.isEmpty(result.data)) _.extend(options.data[result.id], result.data);

        }

        i++;

    }


    //more nodes to parse?
    if(nodes.length){

        _.delay(_.bind(function(){ this.parseXML(xmlDocument,{
            data: options.data,
            callback: options.callback,
            total: options.total,
            nodes: nodes
        }) },this),0);

    }
    //complete! no more nodes to parse
    else{

        log( 'COMPLETE! ('+ options.total +'/'+ options.total +') 100%' );

        try{
            options.callback(xmlDocument,options.data);
        }catch(e){

            log( 'CALLBACK ERROR! '+ e.toString() );
        }
    }


    return
}

/**
 * Parses the given XMLNode
 * @param {XMLNode} xmlNode
 * @return {Object} data
 * @return {String} data.id
 * @return {Object} data.data
 */
var parseXMLNode = function(node){
  
  if(!node) return;
  
  //instance returning data object
  var data = {};
  
  //node id which to attach data parsed
  var id = node.getAttribute('id');
  
  //get taxonomy related data
  var categories = node.getAttribute('categories');
  var tags = node.getAttribute('tags');
  
  if(categories) data.categories = categories;
  if(tags) data.tags = tags;
  
  //add "taxonomy-processed" flag attr
  node.setAttribute('taxonomy-processed','true');
  
  return {
    'id': id,
    'data': data
  }
  
}


export default {
  parseXML: parseXML,
  parseXMLNode: parseXMLNode
}