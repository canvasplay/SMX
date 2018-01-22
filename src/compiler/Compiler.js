(function(win,_,$,smx,log){


	//private aux debug system
	const DEBUG = true;
	const LOG = function(o){if(DEBUG)log(o)};


	/**
	 *	util method
	 *	GET_UNIQUE_ID
	 *	returns unique base36 ids strings [0-9]+[a-z]
	 *
	 *	based on _.uniqueId(), incremental starting at 0
	 *	Native Intger.toString only handles up base 36
	 *
	 *  base36 [0-9]+[a-z]
     *  base62 [0-9]+[a-z]+[A-Z] but requires BigInt.js!
	 *
	 */

	const GET_UNIQUE_ID = function(){ return parseInt(_.uniqueId()).toString(36) };
	//const GET_UNIQUE_ID = ()=>{ return bigInt2str(str2bigInt(_.uniqueId()+"",10,0,0),62) };




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
		src = _.compact(src.split('/'));
		
		//if multipart, last is file
		if(src.length>0) file = src.pop();

    //join path parts
		path = src.join('/')+'/';

		//set inlcuded node core attributes
		//if(path) node.setAttribute('path', path);
		//if(file) node.setAttribute('file', file);
		if(path) $(node).attr('path', path);
		if(file) $(node).attr('file', file);
		
		return node;

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
			"path" : "",
			"directoryIndex" : "index.xml",
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

		this.loadDocument = function(path){

			//set path
			this.options.path = (path)? path : '';

			var url = (this.options.path!=='')? this.options.path + this.options.directoryIndex : ''+this.options.directoryIndex;
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

        xml = resolvePathFileAttributes(xml, xhr._url);

				//set xml root node
				this.XML = $(xml)[0];
				

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

				}

				//resolve 'path' and 'file' attributes from 'src'
				resolvePathFileAttributes(new_node, old_node.getAttribute('src'));

				//copy old node attributes into new node
				copyAttributes(old_node, new_node);

				//replace old node with new node
				//create clone of new node due wired ipad IOS4 jquery error
				//WRONG_DOCUMENT_ERR node was used in a different document...
				//$(old_node).replaceWith(new_node));
				$(old_node).replaceWith($(new_node).clone());

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

					//if (inc_path && inc_path!= '') this.loadFile(this.options.path + inc_path, inc_type);
					if (inc_path && inc_path!= '') this.loadFile(inc_path, inc_type);

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

			try{

				//XML = this.cleanUp(XML);
				XML = this.normalizeIdAttributes(XML);
				XML = this.normalizeTimeAttributes(XML);
				//XML = this.compressXML(XML);

			}
			catch(e){
				LOG('ERROR! factorizeXML failed!')
			}

			/*
			try{ this.compressXML() }
			catch(e){
				LOG('ERROR! compressXML failed!')
			}
			*/



			this.XML = XML;
			this.TEXT = this.XML2str(this.XML);


			this.trigger('complete', XML);

			return;

		};
		





		this.normalizeIdAttributes = function(xml){


			//ids control
			//ensure all nodes have a valid and unique id attribute

			//get all nodes missing [id] attribute, but...
			//excluding contents of any node defining [type]
			//excluding <metadata> nodes and its contents
			//excluding <prototype> nodes and its contents
			var $req_id_nodes = $(xml).find(':not([id]):not(metadata):not(metadata *):not(prototype):not(prototype *):not([type] *)').get();
			var $having_id_nodes = $(xml).find('[id]:not(metadata):not(metadata *):not(prototype):not(prototype *):not([type] *)').get();
			
			//include root xml node itself in the list
			if(!$(xml).attr('id'))
			  $req_id_nodes.unshift(xml);
			else
			  $having_id_nodes.unshift(xml);
			

			var in_use_ids = [];

			//get already in use id values
			for(var i=0; i< $having_id_nodes.length;i++){

				var node = $having_id_nodes[i];

				in_use_ids.push($(node).attr('id'));

			}


			//assign unique id to requiring ones
			for(var i=0; i< $req_id_nodes.length;i++){

				var node = $req_id_nodes[i];

				in_use_ids.push($(node).attr('id'));

				var new_id = GET_UNIQUE_ID();

				while(_.includes(in_use_ids,new_id)){
 					new_id = GET_UNIQUE_ID();
				}

				$(node).attr('id',new_id);

			}

			LOG('RESOLVE IDs ('+ $req_id_nodes.length +' nodes)')


			return xml;

		};


		this.normalizeTimeAttributes = function(XML){

			//normalize all attributes refering time values
			var parseTime = function(value, default_value){

				if ( !value || !_.isString(value) || value == 'auto' || value<0 )
					return default_value;

				var important = false;
				if(value.indexOf('!')==0){
					important = true;
					value = value.substr(1);
				}

				if (value.indexOf(':')>=0){

					var sum = 0;
					var factor = 1;
					var values=(value).split(':');
					values.reverse();
					for (var i = 0; i<values.length; i++){
						sum += parseFloat(values[i])*factor;
						factor = factor*60;
					}

					if (important) 	return '!'+sum;
					else 			return sum;
				}

				if (important) 	return '!'+parseFloat(value);
				else 			return parseFloat(value);

			};

			//get timed nodes
			var timed_nodes = $(XML).find('[duration],[start],[offset]');


			for(var i=0; i< timed_nodes.length;i++){

				var $node = $(timed_nodes[i]);

				var duration = $node.attr('duration');
				var start = $node.attr('start');
				var offset = $node.attr('offset');

				if (duration) $node.attr('duration',parseTime(duration,'auto'));
				if (start) $node.attr('start',parseTime(start,'auto'));
				if (offset) $node.attr('offset',parseTime(offset,0));

			}

			LOG('RESOLVE TIMEs ('+ timed_nodes.length +' nodes)')

			return XML;

		};



		this.compressXML = function(XML){


			//get serialized xml code
			var code = this.XML2str(XML);


			//remove multiple whitespaces
			var min = code.replace(/\s+/gm," ");



			//remove newline / carriage return
			min = min.replace(/\n/g, "");

			/*

				//this will broke html content spaces content...

				//remove whitespace (space and tabs) before tags
				min = min.replace(/[\t ]+\</gm, "<");

				//remove whitespace between tags
				min = min.replace(/\>[\t ]+\</gm, "><");

				//remove whitespace after tags
				min = min.replace(/\>[\t ]+$/gm, ">");

			*/

			//remove XML comments
			min = min.replace(/<!--(.*?)-->/gm, "");


			//convert back to xml
			var xml = str2XML(min);

			var removeBlankTextChildNodes = function(node){

				var childs = node.childNodes;
				var to_remove = [];

				for(var i=0; i< childs.length;i++){

					var child = childs[i];

					var is_cdata = (child.nodeType==4);
					var is_text = (child.nodeType==3);
					var is_node = (child.nodeType==1);
					var name = child.nodeName;

					if(is_text){
						to_remove.push(child);
					}
					else if(is_node && name!='metadata'){

						var type = child.getAttribute('type');

						if( !type || type =='smx'){
							var _childs = removeBlankTextChildNodes(child);
						}

					}

				}

				for(var i=0; i< to_remove.length;i++){

					var child = to_remove[i];
					var parent = child.parentNode;
					parent.removeChild(child);

				}

			}

			removeBlankTextChildNodes(xml);

			//update compiler xml result
			return xml;

		};


		this.XML2str = function(XML){

			var str = '';

			if (win.ActiveXObject){

				if (XML.xml) 	str = XML.xml;
				else 			str = (new XMLSerializer()).serializeToString(XML);

			}
			else{
				str = (new XMLSerializer()).serializeToString(XML);
			}

			return str;

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