import sizzle from 'sizzle';
import Eventify from 'eventify';
import IdAttributeProcessor from './IdAttributeProcessor.js';


/**
 * @memberof smx
 * @desc
 * The Loader class loads, parses, and transforms XML data
 * from multiple sources.
 *
 * The Loader can load data from valid XMLDocument sources,
 * p.e. from an url, an XJSON oject or an XMLDocument object.
 * The Loader can also load asyc and merge recursively new content from
 * other valid sources, url or objects.
 *
 * ### Reserved XML: `<include>`
 */
class Loader{
  
  /** @constructor */
  constructor(){
    
  	//extend with events on, off, trigger
  	Eventify.enable(this);
  
  	// XML Document Object
  	this.xmlDocument = null;
  
    /**
     * @member {XMLHttpRequest}
     * @desc xhr controller for file requests
     * @private
     */
  	this.xhr = null;

  }
  
  /**
   * Loads the resource for the given url.
   * @param {String} url
   * @async
   * @trigger smx.Loader:event:complete
   * @trigger smx.Loader:event:error
   */
	load(url){
    
    var onSuccess = this.onLoadFileSuccess.bind(this);
    var onError = this.onLoadFileError.bind(this);
    
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', url, true);
    this.xhr.onreadystatechange = function(evt){
      
      if (this.readyState !== 4) return;
      if (this.status >= 200 && this.status < 400)
        onSuccess(evt.target);
      else
        onError(evt.target);
        
    };
    this.xhr.send();
    
    return;
    
	}

	onLoadFileSuccess(xhr){
    
    
    log('> '+ xhr.responseURL+' '+xhr.status +' ('+ xhr.statusText+')');
    //log( xhr.responseText);
    //var ext = xhr.responseURL.split('.').pop();
    
		//detect if already exist xml root node
		var is_root = (!this.xmlDocument)? true : false;
    
		if (is_root){
		  
		  //resolve as error if first loaded file is not a valid XMLDocument
		  if(!xhr.responseXML)
		    throw new Error('Invalid XML root');
      
			//set xml root document
			this.xmlDocument = xhr.responseXML;
			
      //ignore XMLDocument and other unwanted nodes like comments, text, ...
      //get just the root XMLElement as lastChild in document
			var node = this.xmlDocument.lastChild;

			resolvePathFileAttributes(node, xhr.responseURL);
      
		}
		else{
      
			//get 1st <include> found in current XMLDocument
			var include = sizzle('include[loading="true"]', this.xmlDocument)[0];

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
			  new_node = createDataNode(this.xmlDocument, nodeName, data, type);

			}

			//resolve 'path' and 'file' attributes from original 'src'
			resolvePathFileAttributes(new_node, include.getAttribute('src'));

			//copy attributes from include node to the new node
			copyAttributes(include, new_node);

			//replace include node with the new node
			include.parentNode.replaceChild(new_node, include);

		}


    var inc = parseIncludes(this.xmlDocument);

    if(inc){
      
      //flag include node as loading
      inc.setAttribute('loading','true');
        
  		//get include target url
  		var url = inc.getAttribute('src') || '';
      
      //replace @lang keyword in src
  		//if(url.indexOf('@lang')>=0) url = url.replace(/@lang/g, this.options.lang);
      
  		//resolve full url
  		var ref = inc;
  		while (ref.parentNode){
  			var parent = ref.parentNode;
  			var path = (parent.getAttribute) ? parent.getAttribute('path') || '' : '';
  			url = path+url;
  			ref = parent;
  		}
      
      this.load(url);
      
    }
    else
		  this.onLoadXMLComplete();

		return;

	}

	onLoadFileError(xhr){
    
    log( '> '+ xhr.responseURL+'" '+xhr.status +' ('+ xhr.statusText+')');
		this.trigger('error', xhr.responseText);
		
	}

	onLoadXMLComplete(){
    
    //ensure all nodes have unique id
    IdAttributeProcessor.process(this.xmlDocument);
    
    //trigger complete event
		this.trigger('complete', this.xmlDocument);
    
		return;
    
	}
	
	XML2str(xmlNode) {
    
    try {
      // Gecko/Webkit-based browsers (Firefox, Chrome, Opera...
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
	}
	

	str2XML(str){

		var xml = null;

    if (global.ActiveXObject){

      xml = new ActiveXObject('Microsoft.XMLDOM');
      xml.async = 'false';
      xml.loadXML(str);

    } else {

      var parser = new DOMParser();
      xml = parser.parseFromString(str,'text/xml');

    }

    return xml;
	}

}


//
//  PRIVATE HELPER METHODS
//

var copyAttributes = function(srcNode, targetNode){
  
  var ignoreAttributes = ['src','path','file'];
  
  var attrs = srcNode.attributes;
  
  for (var i=0; i< attrs.length; i++){
    
    var name = attrs[i].name;
    var value = attrs[i].value;
    
    if(ignoreAttributes.indexOf(name)<0){
      var attr = targetNode.getAttribute(name);
      if(typeof attr === undefined || attr === null || attr === false)
        targetNode.setAttribute(name, value);
    }
    
  }
  
  return targetNode;
  
};

var resolvePathFileAttributes = function(xmlNode, url){
  
  //get src string from xmlNode attribute or given url
  let src = (url)? url : xmlNode.getAttribute('src');
  
  //declare resultant attribute values
	var path, file;
	
	//no src string? just ignore..
	if(!src) return xmlNode;
  
	//split by slashes
	src = src.split('/');
	
	//if multipart, last is file
	if(src.length>0) file = src.pop();
  
  //join path parts
	path = src.join('/')+'/';
  
	//set inlcuded xmlNode core attributes
	if(path) xmlNode.setAttribute('path', path);
	if(file) xmlNode.setAttribute('file', file);
	
	return xmlNode;

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
  var includes = sizzle('include', xmlDocument);
  
  //iterate and filter includes
  while(!inc && includes.length>0){
    
		var follow = true;
    
		//get first include found
		inc = includes.shift();
    
    //FILTER BY LANG ATTR
		//attribute lang must match options lang
		//var inc_lang = inc.getAttribute('lang');
		//if(inc_lang && inc_lang!=this.options.lang) follow = false;
    
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
 * Fired when loading completes sucessfully.
 * @event complete
 * @memberof smx.Loader
 * @return {XMLDocument}
 */

/**
 * Fired when loading fails
 * @event error
 * @memberof smx.Loader
 * @return {Object}
 */

export default Loader;