import Sizzle from 'sizzle';

/**
 * SMX Taxonomy Processor
 * @module TaxonomyProcessor
 * @memberof smx.module:Taxonomy
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
 * Processes the given XMLDocument
 * @param {XMLNode} xmlDocument
 * @param {Object} options
 * @async
 */
var processXMLDocument = function(xmlDocument, opt){

    //xmlDocument required!
    if(!xmlDocument) return;

    //normalize options
    var options = _.extend({
        data: {},
        callback: function(){ return },
        total: 0,
        nodes: null
    },opt);


    // get all unparocessed nodes based on flag attr
    // `taxonomy-processed` attribute is added while processing
    // nodes missing the flag attr are the nodes we need to be processed
    var nodes;
    if(!options.nodes) nodes = Sizzle('[categories]:not([taxonomy-processed])', xmlDocument);
    else nodes = options.nodes;


    //calculate percent progress
    if(nodes.length > options.total) options.total = nodes.length;
    var percent =  100- parseInt((nodes.length*100) / options.total) || 0;


    log('PROCESSING TAXONOMY... ('+ (options.total-nodes.length) +'/'+ options.total +') '+percent+'%');


    var max_iterations = 100;
    var i = 0;

    while(nodes.length && i<max_iterations){

        var node = nodes.shift();

        var result = this.processXMLNode(node);

        if(result){

            //create node data object if does not exists yet
            if (!options.data[result.id]) options.data[result.id] = {};

            //extend parent data object
            if(!_.isEmpty(result.data)) _.extend(options.data[result.id], result.data);

        }

        i++;

    }


    //more nodes to process?
    if(nodes.length){

        _.delay(_.bind(function(){ this.processXMLDocument(xmlDocument,{
            data: options.data,
            callback: options.callback,
            total: options.total,
            nodes: nodes
        }) },this),0);

    }
    //complete! all nodes processed
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
 * Process the given XMLNode
 * @param {XMLNode} xmlNode
 * @return {Object} data
 * @return {String} data.id
 * @return {Object} data.data
 */
var processXMLNode = function(node){
  
  if(!node) return;
  
  //instance returning data object
  var data = {};
  
  //node id which to attach processed data
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
  processXMLDocument: processXMLDocument,
  processXMLNode: processXMLNode
}