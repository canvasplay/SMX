(function(global, Sizzle, smx, LOG){
 

var DATA;
var PARSER_INDEX;

/**
 * Loads a new smx document.
 * @memberof smx
 * @param {String} url
 * @param {smx~onLoadSuccess} onSuccess
 * @param {smx~onLoadError} onError
 * @async
 */
smx.load = function(data, success, error){

  if(!data) return;
  
  //conditional loading should check for multiple data source types
  //from url file as xml or json file... from xmlNode... from json object...
  //for now just proceed assuming an url for an xml file
  SUCCESS_CALLBACK = success;
  ERROR_CALLBACK = error;
  
  DATA = {};
  PARSER_INDEX = 0;
  
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
	var loader = new smx.Loader();
	loader.on('complete', APPLY_PARSERS);
	loader.on('error', LOAD_SMX_ERROR);
	loader.loadDocument(url);
};

var LOAD_SMX_DOCUMENT_FROM_JSON = function(data){
	var x2js = new X2JS();
	var xmlDocument = x2js.json2xml(data);
	APPLY_PARSERS(xmlDocument);
};


var APPLY_PARSERS = function(xmlDocument){
  var xml = xmlDocument;
  var parser = smx.parsers[PARSER_INDEX];
  if(parser){
    parser(xml, function(data){
      if(data)
        Object.assign(DATA,data);
      PARSER_INDEX = PARSER_INDEX+1;
      APPLY_PARSERS(xml);
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

  LOG('CLEANING XML: '+ count+' nodes removed');
  
	CREATE_SMX_DOCUMENT(xml);

};



var CREATE_SMX_DOCUMENT = function(xml){
 

	LOG('smx load complete!');

	var d = new smx.Document(xml);
	
  Object.assign(d,DATA);
  
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

	LOG('smx load error: '+e);
	
	ERROR_CALLBACK(e);

	return;

};


})(window, window.Sizzle, window.smx, window.log);