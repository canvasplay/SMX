(function(global,_,smx,LOG){


  var copyAttributes = function(srcNode, targetNode){
    
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
    
  };

  var resolvePathFileAttributes = function(node, url){
    
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

  };
  
  
  var createDataNode = function(xmlDocument, nodeName, data, type){
    var node = xmlDocument.createElement(nodeName);
		var cdata = xmlDocument.createCDATASection(data);
		node.appendChild(cdata);
		node.setAttribute('type', type || 'cdata');
    return node;
  };
  
  var parseIncludes = function(xmlDocument){
    
    var inc;
    
    //find all existing <include> nodes
    var includes = Sizzle('include', xmlDocument);
    
    //iterate and filter includes
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
				inc.parentNode.removeChild(inc);
				inc = null;
			}
      
    }
    
    return inc;
    
  };
  


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

			this.loadFile(url);


			return;

		};

		this.loadFile = function(url){
      
      var onSuccess = _.bind(this.onLoadFileSuccess, this);
      var onError = _.bind(this.onLoadFileError, this);
      
      this.xhr;
      if(global.ActiveXObject)
        this.xhr = new global.ActiveXObject("MSXML2.XMLHTTP.3.0");
      else
        this.xhr = new global.XMLHttpRequest();
        
      this.xhr.open('GET', url);
      this.xhr.onload = function(evt) {
          if (evt.target.status === 200)
            onSuccess(evt.target);
          else
            onError(evt.target);
      };
      this.xhr.send();

	 		return;

		};

		this.onLoadFileSuccess = function(xhr){
      
      
      LOG('> '+ xhr.responseURL+' '+xhr.status +' ('+ xhr.statusText+')');
      //LOG( xhr.responseText);
      //var ext = xhr.responseURL.split('.').pop();
      
			//detect if already exist xml root node
			var is_root = (!this.XML)? true : false;
      
			if (is_root){
        
				//set xml root document
				this.XML = xhr.responseXML;
				
        //ignore XMLDocument and other unwanted nodes like comments, text, ...
        //get just the root XMLElement as lastChild in document
				var node = this.XML.lastChild;

				resolvePathFileAttributes(node, xhr.responseURL);
        
			}
			else{
        
				//get 1st <include> found in current XMLDocument
				var include = Sizzle('include[loading="true"]', this.XML)[0];

        //resolve if just loaded data is an XML document or not
        var isXml = (xhr.responseXML)? true : false;
        
        //ignore XMLDocument and other unwanted nodes like comments, text, ...
        //get just the root XMLElement as lastChild in document
				var new_node = (xhr.responseXML)? xhr.responseXML.lastChild : null;

				//not xml? create a new xml node to wrap the loaded data
				if(!new_node){
				  
				  //resolves new node name based on include's name attribute
				  //defaults to generic the nodeName `node`
				  var nodeName = include.getAttribute('name') || 'node';
				  
				  //get just loaded data
				  var data = xhr.responseText;
				  
				  //autodetect data type based on just loaded file extension
				  var type = include.getAttribute('src').split('.').pop();
				  
          //create new data node
				  new_node = createDataNode(this.XML, nodeName, data, type);

				}

				//resolve 'path' and 'file' attributes from 'src'
				resolvePathFileAttributes(new_node, include.getAttribute('src'));

				//copy attributes from include node to the new node
				copyAttributes(include, new_node);

				//replace include node with the new node
				include.parentNode.replaceChild(new_node, include);

			}


      var inc = parseIncludes(this.XML);

      if(inc){
        
        //flag include node as loading
        inc.setAttribute('loading','true');
          
    		//get include target url
    		var url = inc.getAttribute('src') || '';
        
        //replace @lang keyword in src
    		if(url.indexOf('@lang')>=0) url = url.replace(/@lang/g, this.options.lang);
        
    		//resolve full url
    		var ref = inc;
    		while (ref.parentNode){
    			var parent = ref.parentNode;
    			var path = (parent.getAttribute) ? parent.getAttribute('path') || '' : '';
    			url = path+url;
    			ref = parent;
    		}
        
        this.loadFile(url);
        
      }
      else
			  this.onLoadXMLComplete();

			return;

		};

		this.onLoadFileError = function(xhr){

      LOG( '> '+ xhr.responseURL+'" '+xhr.status +' ('+ xhr.statusText+')');
			this.trigger('error', xhr.responseText);
			
		};

		this.onLoadXMLComplete = function(){

			var XML = this.XML;

			//extract last child XMLnode in resultant XMLDocument and ignore the document...
  		//using lastChild prevents getting unwanted xml nodes...
      //IE8 p.e. returns "ProcessingInstruction" for firstChild
      XML = XML.removeChild(XML.lastChild);
      
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
          alert('XMLSerializer not supported');
        }
      }
      
      return '';
		};
		

		this.str2XML = function(str){

			var XML = null;

      if (global.ActiveXObject){

        XML = new ActiveXObject('Microsoft.XMLDOM');
        XML.async = 'false';
        XML.loadXML(str);

      } else {

        var parser = new DOMParser();
        XML = parser.parseFromString(str,'text/xml');

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





})(window,window._,window.smx,window.log);