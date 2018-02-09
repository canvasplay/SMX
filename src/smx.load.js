(function(global, Sizzle, smx, LOG){
 
 
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
 
 
	/////////////////////////////////////////////////////////////////////////////////////
	// LOADING AND COMPILE SMX DOCUMENT

	var SMX_COMPILER = null;

	var LOAD_SMX_DOCUMENT = function(url){


		//INSTANCE SMX COMPILER
		SMX_COMPILER = new smx.Compiler();

		//SMX_COMPILER.on('complete', LOAD_SMX_COMPLETE);
		SMX_COMPILER.on('complete', PARSE_METADATA);
		SMX_COMPILER.on('error', LOAD_SMX_ERROR);


		//global
		//global['$compiler'] = SMX_COMPILER;

		//var data_path = app.config.DATA_PATH || '';
		//if(app.config.PACKAGE) data_path = app.config.PACKAGE+'/'+ data_path;

		SMX_COMPILER.loadDocument(url);

		return;

	};



	var LOAD_SMX_DOCUMENT_FROM_JSON = function(data){

		var x2js = new X2JS();

		var XML = x2js.json2xml(data);
		
		//XML = XML.removeChild(XML.lastChild);

		PARSE_METADATA(XML);

	};




	var PARSE_METADATA = function(xml){

		smx.meta.parseXML(xml,{

			callback: function(XML,data){

				global.$meta = data;

				PARSE_PROTOTYPES(XML);

			}

		});

		return;
	};


	var PARSE_PROTOTYPES = function(xml){

		smx.proto.parseXML(xml,{

			propagate: true,

			callback: function(XML,data){

				//console.log(data);

				CLEAN_TEXT_NODES(XML);

			}

		});


	};


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
    
		LOAD_SMX_COMPLETE(xml);

	};



	var LOAD_SMX_COMPLETE = function(xml){

		LOG('smx load complete!');

		var d = new smx.Document(xml);
		
		smx.documents.push(d);
		
		//set it as active document if its empty
		if(!smx.document) smx.document = d;
		
		SUCCESS_CALLBACK(d);

		return;

	};

	var LOAD_SMX_ERROR = function(e){

		LOG('smx load error: '+e);
		
		ERROR_CALLBACK(e);

		return;

	};

 
})(window, window.Sizzle, window.smx, window.log);