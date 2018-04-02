import SMXLoader from './loader/Loader.js';
import SMXDocument from './document/Document.js';

var DATA;
var PROCESSOR_INDEX;

/**
 * Loads a new smx document.
 * @memberof smx
 * @method load
 * @param {String} url
 * @param {smx~onLoadSuccess} onSuccess
 * @param {smx~onLoadError} onError
 * @async
 */
var LOAD = function(data, success, error){

  if(!data) return;
  
  //conditional loading should check for multiple data source types
  //from url file as xml or json file... from xmlNode... from json object...
  //for now just proceed assuming an url for an xml file
  SUCCESS_CALLBACK = success || function(){};
  ERROR_CALLBACK = error || function(){};
  
  DATA = {};
  PROCESSOR_INDEX = 0;
  
  if(typeof data === 'string')
    LOAD_SMX_DOCUMENT(data);
  else
    LOAD_SMX_DOCUMENT_FROM_JSON(data);
  
};


/**
 * Callback function when loading completes succefully.
 * @callback smx~onLoadSuccess
 * @param {SMXDocument} document - Just loaded document
 */
var SUCCESS_CALLBACK = function(document){};

/**
 * Callback function used loading throws an error.
 * @callback smx~onLoadError
 * @param {Error} error - Error object
 */
var ERROR_CALLBACK = function(e){};
 

var LOAD_SMX_DOCUMENT = function(url){
	var loader = new SMXLoader();
	loader.on('complete', APPLY_PROCESSORS);
	loader.on('error', LOAD_SMX_ERROR);
	loader.load(url);
};

var LOAD_SMX_DOCUMENT_FROM_JSON = function(data){
	var x2js = new X2JS();
	var xmlDocument = x2js.json2xml(data);
	APPLY_PROCESSORS(xmlDocument);
};


var APPLY_PROCESSORS = function(xmlDocument){
  var xml = xmlDocument;
  var processor = smx.modules[PROCESSOR_INDEX].Processor;
  if(processor){
    processor(xml, function(data){
      if(data)
        Object.assign(DATA,data);
      PROCESSOR_INDEX++;
      APPLY_PROCESSORS(xml);
    })
  }
  else{
    CLEAN_TEXT_NODES(xml);
  }
}


var CLEAN_TEXT_NODES = function(xml){

  var count = 0;

	function clean(node){

		for(var n = 0; n < node.childNodes.length; n ++){

			var child = node.childNodes[n];

			//	1	ELEMENT_NODE
			//	2	ATTRIBUTE_NODE
			//	3	TEXT_NODE
			//	4	CDATA_SECTION_NODE
			//	5	ENTITY_REFERENCE_NODE
			//	6	ENTITY_NODE
			//	7	PROCESSING_INSTRUCTION_NODE
			//	8	COMMENT_NODE
			//	9	DOCUMENT_NODE
			//	10	DOCUMENT_TYPE_NODE
			//	11	DOCUMENT_FRAGMENT_NODE
			//	12	NOTATION_NODE
			
			var isElementNode = function(n){ return n.nodeType===1 };
			var isCommentNode = function(n){ return n.nodeType===8 };
			var isEmptyTextNode = function(n){ return n.nodeType===3 && !/\S/.test(n.nodeValue) };

			if( isCommentNode(child) || isEmptyTextNode(child) ){
			  node.removeChild(child);
			  count++;
			  n --;
			}
			else if( isElementNode(child) ){
			  clean(child);
			}


		}

	}

	clean(xml);

  log('CLEANING XML: '+ count+' nodes removed');
  
	CREATE_SMX_DOCUMENT(xml);

};



var CREATE_SMX_DOCUMENT = function(xml){
 

	log('smx load complete!');

	var d = new SMXDocument(xml);
	
  Object.assign(d._data,DATA);
  
	smx.documents.push(d);
	
	//set it as active document if its empty
	if(!smx.document) smx.document = d;
	
	SUCCESS_CALLBACK(d);
  
}


var LOAD_SMX_COMPLETE = function(smxDocument){
	
	SUCCESS_CALLBACK(d);

	return;

};

var LOAD_SMX_ERROR = function(e){

	log('smx load error: '+e);
	
	ERROR_CALLBACK(e);

	return;

};

export default LOAD;