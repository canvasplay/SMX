(function(win,_,$,smx,log){


	//private aux debug system
	const DEBUG = true;
	const LOG = function(o){if(DEBUG)log(o)};


  function copyAttributes(srcNode, targetNode){
    
    var ignore_attributes = ['src','path','file'];
    
    var attrs = srcNode.attributes;
    
    for (var i=0; i< attrs.length; i++){
      
      var name = attrs[i].name;
      var value = attrs[i].value;
      
      if(!_.includes(ignore_attributes, name)){
        var attr = targetNode.getAttribute(name);
        if(typeof attr === undefined || attr === null || attr === false)
          targetNode.setAttribute(name, value);
      }
      
    }
    
    return targetNode;
    
  }

  function resolvePathFileAttributes(node, url){
    
    //get src string from node attribute or given url
    let src = (url)? url : node.getAttribute('src');
    
    //declare resultant attribute values
		var path, file;
		
		//no src string? just ignore..
		if(!src) return node;
    
		//split by slashes and also
		//clean empty or empty src parts
		//src = _.compact(src.split('/'));
		src = src.split('/');
		
		//if multipart, last is file
		if(src.length>0) file = src.pop();
    
    //join path parts
		path = src.join('/')+'/';
    
		//set inlcuded node core attributes
		if(path) node.setAttribute('path', path);
		if(file) node.setAttribute('file', file);
		
		return node;

  }
  
  
  function mergeNode(){
    
  }

/**
 * SMX Compiler Class
 * @class Compiler
 */
 
 	var DocumentCompiler = function(options){


		//extended with custom events
		_.extend(this, Backbone.Events);

		//define default options
		this.defaults = {
			"lang":"es-ES"
		};

		// process options
		this.options = _.defaults(options || {}, this.defaults);

		// XML Document Object
		this.XML = null;

		// TEXT XML code String (compressed & factorized)
		this.TEXT = null;

		// xhr controller for file requests
		this.xhr = null;

		this.loadDocument = function(url){

			this.loadFile( url , 'smx');


			return;

		};

		this.loadFile = function(_url, _type){

			//check url param?
			if(!_.isString(_url) || _url==="") this.onLoadFileError('ERROR: loadFile -> no file');


			this.xhr = $.ajax({
				'type': "GET",
				'url': _url,
				//'dataType': "xml",
				'cache': false,
				'data':'',
				'success': _.bind(this.onLoadFileSuccess, this),
				'error': _.bind(this.onLoadFileError, this)
	 		});

			//reference for later use...
	 		this.xhr._url = _url;
	 		this.xhr._type = _type;

	 		return;

		};

		this.onLoadFileSuccess = function(xml, status, xhr){
      
      
			LOG( '> '+this.xhr._url+'" '+this.xhr.status +' '+ this.xhr.statusText);
      
			//detect if already exist xml root node
			var is_root = (!this.XML)? true : false;
      
			if (is_root){
        
				//set xml root document
				this.XML = xml;
				
				//extract desired root XMLnode in resultant XMLDocument and ignore the document...
				//IE8 p.e. returns "ProcessingInstruction" for firstChild
				//using lastChild prevents getting unwanted xml nodes...
				var node = xml.lastChild;

				resolvePathFileAttributes(node, xhr._url);
        
			}
			else{
        
				//if is not root -> is an include
				//replaces 1st <include> found with just loaded xml

				var includes = $(this.XML).find('include');

				//get <include> node
				var old_node = includes[0];


				//get just loaded node
				//ensure we are getting nodeType=1 (XMLElement)
				//and avoid other nodetypes like comments, text nodes, ...
				var new_node;
				if(xml.childNodes){
					for(var i=0; i< xml.childNodes.length; i++){
						if (xml.childNodes[i].nodeType==1)
							new_node = xml.childNodes[i];
					}
				}

				//prepare and merge the new XMLNode
				if (!new_node){
				  
					var node_name = $(old_node).attr('name') || 'node';
					new_node = this.XML.createElement(node_name);

					var cdata = this.XML.createCDATASection(xml);

					//console.log(xml.toString());
					//new_node.innerHTML = '<![CDATA[ '+xml+' ]]>';
					//new_node.innerHTML = ''+xml+'';
					new_node.appendChild(cdata);
					
					//set type attribute based on just loaded file extension
					var ext = old_node.getAttribute('src').split('.').pop();
					new_node.setAttribute('type',ext);

				}

				//resolve 'path' and 'file' attributes from 'src'
				resolvePathFileAttributes(new_node, old_node.getAttribute('src'));

				//copy old node attributes into new node
				copyAttributes(old_node, new_node);

				//replace old node with new node
				//WRONG_DOCUMENT_ERR node was used in a different document...
				old_node.parentNode.replaceChild(new_node.cloneNode(true), old_node);

			}


			//check for <include>?
			var includes = $(this.XML).find('include').get();
			if(includes.length>0){

				//get first include found
				var inc;


				//filter excluding non matching " ... " inlcudes
				while(!inc && includes.length>0){

					var follow = true;

					//get first include found
					inc = includes.shift();


					//FILTER BY LANG ATTR
					//attribute lang must match options lang
					var inc_lang = inc.getAttribute('lang');
					if(inc_lang && inc_lang!=this.options.lang) follow = false;


					//FILTER BY IGNORE ATTR
					//exclude if ignore attribute is defined and != false
					var inc_ignore = inc.getAttribute('ignore');
					if(inc_ignore==='true') follow = false;

					if(!follow){
						$(inc).remove();
						inc = null;
					}


				}


				if(inc){


					//get include target url
					var inc_path = $(inc).attr('src') || '';
					var inc_type = $(inc).attr('type') || '';

					//RESOLVE TARGET URL VALUE
					//

					if(inc_path.indexOf('@lang')>=0) inc_path = inc_path.replace(/@lang/g, this.options.lang);

					//
					/////

					//resolve context path
					var ref = inc;
					while (ref.parentNode){
						var parent = ref.parentNode;
						if ($(parent).attr('path')) inc_path = $(parent).attr('path') + inc_path;
						ref = parent;
					}

					if (inc_path && inc_path !== '') this.loadFile(inc_path, inc_type);

					return;

				}


			}



			this.onLoadXMLComplete();

			return;

		};

		this.onLoadFileError = function(e){

			LOG( '> '+this.xhr._url+'" '+this.xhr.status +' '+ this.xhr.statusText);

			this.trigger('error',e);
		};

		this.onLoadXMLComplete = function(){

			var XML = this.XML;

			//extract last child XMLnode in resultant XMLDocument and ignore the document...
  		//using lastChild prevents getting unwanted xml nodes...
      //IE8 p.e. returns "ProcessingInstruction" for firstChild
      XML = XML.removeChild(XML.lastChild);
			
			//also extract file and path attributes
			$(XML).attr('path', $(this.XML).attr('path'));
			$(XML).attr('file', $(this.XML).attr('file'));
			
			
      //ATTRIBUTE PARSING
      
      //get defined parsers from smx ns
      var parsers = smx.AttributeParsers;
      
      //do parsing one by one
      for(var i=0, len=parsers.length; i<len; i++ )
        XML = parsers[i].parse(XML);



			this.XML = XML;
			this.TEXT = this.XML2str(this.XML);


			this.trigger('complete', XML);

			return;

		};
		
		this.XML2str = function (xmlNode) {
      
      try {
        // Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
        return (new XMLSerializer()).serializeToString(xmlNode);
      }
      catch (e) {
        try {
          // Internet Explorer.
          return xmlNode.xml;
        }
        catch (e) {
          //Other browsers without XML Serializer
          alert('Xmlserializer not supported');
        }
      }
      
      return '';
		};
		

		this.str2XML = function(str){

			var XML = null;

      if (win.ActiveXObject){

        var XML = new ActiveXObject('Microsoft.XMLDOM');
        XML.async = 'false';
        XML.loadXML(str);

      } else {

        var parser = new DOMParser();
        var XML = parser.parseFromString(str,'text/xml');

      }

      return XML;
		};
		

		return this;


	};


	//expose
	smx.Compiler = DocumentCompiler;





/*
// UTIL METHODS

var CLEAN_XML_NODE = function(xml){

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
			
			var isElementNode = function(n){ return n.nodeType===1 }
			var isCommentNode = function(n){ return n.nodeType===8 }
			var isEmptyTextNode = function(n){ return n.nodeType===3 && !/\S/.test(n.nodeValue) }

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

};
*/





})(window,_,$,smx,log);