/**
 * SMX DOCUMENT COMPILER
 * Load smx xml document, search and load recursively "include" nodes
 */

(function(window,_,$,smx){



	/**
	 *	Element definitions are flexible, but there some reserved tagnames
	 *	<smx>		root of any smx document
	 *	<head>		smx definitions container
	 *	<body>		smx content container
	 *	<include>	include another smx document
	 *	
	 */

	var SMX_ELEMENTS = {

		'smx':{},

		'head':{},

		'body':{},

		'proto':{},

		'include':{}

	};

	var SMX_ATTRIBUTES = {

		'id':{},

		'path':{}, 'file':{}, 'src':{},	

		'meta':{}, 'track':{}, 'ui':{}

	};



 	var DocumentCompiler = function(options){


		//extended with custom events
		_.extend(this, Backbone.Events);

		//define default options
		this.defaults = {
			"path" : "",
			"directoryIndex" : "index.xml",
			"compiled" : false
		};

		// process options
		this.options = _.defaults(options || {}, this.defaults);

		// XML Dcoument Object
		this.XML = null;

		// TEXT XML code String (compressed & factorized)
		this.TEXT = null;

		// Ajax controller for file requests
		this.AjaxRequest = null;

		this.loadDocument = function(path){

			this.options.path = path || '';


			if (this.options.compiled){
				var url = (this.options.path!='')? this.options.path+'/'+ 'index.txt' : 'index.txt';
				this.loadCompiledFile( url );	
			}
			else{
				var url = (this.options.path!='')? this.options.path+'/'+ this.options.directoryIndex : ''+this.options.directoryIndex;
				this.loadXMLFile( url );				
			}

			
			return;

		};

		this.loadXMLFile = function(file){
		
			//filter params
			if(!file) this.onLoadXMLError('ERROR: loadXMLFile -> no file');

			console.log('@ LOADING XML '+ file +'');
			
			this.AjaxRequest = $.ajax({
				'type': "GET",
				'url': file,
				'dataType': "xml",
				'cache': false,
				'data':'',
				'success': _.bind(this.onLoadXMLSuccess, this),
				'error': _.bind(this.onLoadXMLError, this)
	 		});

	 		this.AjaxRequest.url = file;

	 		return;

		};

		this.onLoadXMLSuccess = function(xml){

			var url = this.AjaxRequest.url;
			//debug.log('OK "'+ url +'" loaded!');

			//detect if already exist xml root node
			var is_root = (!this.XML)? true : false;

			if (is_root){

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
				var new_node = xml.lastChild;

				//copy old_node attributes into new_node 
				$(new_node).attr('id', $(old_node).attr('id'));

				//create 'path' and 'file' from 'src'
				var src_attr = $(old_node).attr('src');
				if (src_attr){

					var path_attr = '';
					var file_attr = '';

					var src_parts = src_attr.split('/');
					if(src_parts.length>0){
						if(src_parts[src_parts.length-1].indexOf('.xml')){
							file_attr = src_parts[src_parts.length-1];
							src_parts.pop();
							path_attr = src_parts.join('/');
						}
						else{
							path_attr = src_attr;
						}
					}
							
					//set inlcuded node core attributes
					if(!_.isEmpty(path_attr)) $(new_node).attr('path', path_attr);
					if(!_.isEmpty(file_attr)) $(new_node).attr('file', file_attr);

				}

				//copy old node attributes into new node
				var old_attributes = old_node.attributes;
				var no_copy_attributes = ['id','src','path','file'];
				for (var i=0; i< old_attributes.length; i++){
					var attr_name = old_attributes[i].name;
					var attr_value = old_attributes[i].value;

					if(!_.contains(no_copy_attributes, attr_name)){
						var attr = $(new_node).attr(attr_name);
						if(typeof attr !== 'undefined' && attr !== false){
							//new node has its own attribute value
						}
						else{
							//copy attribute 
							$(new_node).attr(attr_name, attr_value);	
						}
						
					}
				}				


				//replace old node with new node
				$(old_node).replaceWith(new_node);

			}


			//check for <include>?
			var includes = $(this.XML).find('include');
			if(includes.length>0){

				var include_path = $(includes[0]).attr('src') || '';
				var ref = includes[0];
				while (ref.parentNode){
					var parent = ref.parentNode;
					if ($(parent).attr('path')) include_path = $(parent).attr('path') + '/' + include_path;
					ref = parent;
				}

				if (include_path && include_path!= '') this.loadXMLFile(this.options.path+'/'+include_path);

				return;
			}

			// get server date for date synchronized behaviors
			// client date can be hacked easily
			// rely only on server date instead client date
			// this.serverDate = arguments[2].getResponseHeader('date');


			this.onLoadXMLComplete();

			return;

		};

		this.onLoadXMLError = function(e){

			var url = this.AjaxRequest.url;
			//debug.log('ERROR loading "'+ url +'"');

			this.trigger('error');
		};

		this.onLoadXMLComplete = function(){

			try{ this.factorizeXML() }
			catch(e){
				LOG('COMPILER: ERROR! factorizeXML failed!')
			}

			try{ this.compressXML() }
			catch(e){
				LOG('COMPILER: ERROR! compressXML failed!')
			}
			

			this.trigger('complete', this.XML);

		};



		this.loadCompiledFile = function(file){
		
			//filter params
			if(!file) this.onLoadXMLError('ERROR: loadXMLFile -> no file');

			console.log('@ LOADING COMPILED '+ file +'');
			
			this.AjaxRequest = $.ajax({
				'type': "GET",
				'url': file,
				'dataType': "text",
				'async': false,
				'cache': false,
				'data':'',
				'success': _.bind(this.onLoadCompiledSuccess, this),
				'error': _.bind(this.onLoadCompiledError, this)
	 		});

	 		this.AjaxRequest.url = file;

	 		return;

		};

		this.onLoadCompiledSuccess = function(text){

			this.TEXT = this.decryptText(text);

			//set xml root node
			this.XML = this.str2XML(this.TEXT);

			this.trigger('complete', this.XML);

			return;

		};

		this.onLoadCompiledError = function(e){

			var url = this.AjaxRequest.url;
			//debug.log('ERROR loading "'+ url +'"');

			this.trigger('error');
		};



		this.factorizeXML = function(){

	
			//remove undesired content, xml comments and others
			$(this.XML).find('*').each(function(index,item) {
			    if(item.nodeType != 1) {
			        $(item).remove();
			    }
			});
			

			//ensure all xml nodes have an id attribute
			//var getUTId = function(){ var time = new Date().getTime(); while (time == new Date().getTime()); return new Date().getTime()+''; };
			var nid = 0; var getUTId = function(){ nid=nid+1; return ''+nid };
			$(this.XML).find(':not([id])').each(_.bind(function(index,item){
				$(item).attr('id',getUTId());
			},this));


			//check for duplicated ids
			$(this.XML).find('[id]').each(_.bind(function(index,item){
				var id = $(item).attr('id');
				var ids = $(this.XML).find('[id="'+id+'"]');
				if(ids.length>1 && ids[0]==this)
				console.warn('Multiple IDs #'+id);
			},this));




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

			$(this.XML).find('[duration],[start],[offset]').each(_.bind(function(index,item){

				var duration = $(item).attr('duration');
				var start = $(item).attr('start');
				var offset = $(item).attr('offset');

				if (duration) $(item).attr('duration',parseTime(duration,'auto'));
				if (start) $(item).attr('start',parseTime(start,'auto'));
				if (offset) $(item).attr('offset',parseTime(offset,0));

			},this));


			return;
		};




		this.compressXML = function(){


			//get serialized xml code
			var code = this.XML2str(this.XML);


			//remove multiple whitespaces
			var min = code.replace(/\s+/gm," ");


			//remove newline / carriage return
			min = min.replace(/\n/g, "");

			//remove whitespace (space and tabs) before tags
			min = min.replace(/[\t ]+\</gm, "<");

			//remove whitespace between tags
			min = min.replace(/\>[\t ]+\</gm, "><");

			//remove whitespace after tags
			min = min.replace(/\>[\t ]+$/gm, ">");


			//remove XML comments
			min = min.replace(/<!--(.*?)-->/gm, "");

			//update compiler TEXT result
			this.TEXT = min;



			//update compiler xml result
			this.XML = this.str2XML(min);

			return;
		};


		this.XML2str = function(XML){

			var str = '';

			if (window.ActiveXObject){

				if (XML.xml) str = XML.xml;
				else{
					str = (new XMLSerializer()).serializeToString(XML);
				}

			}
			else{
				str = (new XMLSerializer()).serializeToString(XML);
			}





			/*
			if(window.ActiveXObject){
				alert('window.ActiveXObject: ' + window.ActiveXObject)
			}
			alert('XML.xml: ' +XML.xml);
			*/

			//alert(str);

			return str;	

		};

		this.str2XML = function(str){

			var XML = null;

            if (window.ActiveXObject){

              var XML = new ActiveXObject('Microsoft.XMLDOM');
              XML.async = 'false';
              XML.loadXML(str);

            } else {

              var parser = new DOMParser();
              var XML = parser.parseFromString(str,'text/xml');

            }

            return XML;
		};


		/*
			raw copy from:
			http://davidwalsh.name/convert-xml-json

		*/
		this.xmlToJson = function(xml) {
			
			// Create the return object
			var obj = {};

			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
				obj["@attributes"] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType == 3) { // text
				obj = xml.nodeValue;
			}

			// do children
			if (xml.hasChildNodes()) {
				for(var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof(obj[nodeName]) == "undefined") {
						obj[nodeName] = this.xmlToJson(item);
					} else {
						if (typeof(obj[nodeName].push) == "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(this.xmlToJson(item));
					}
				}
			}
			return obj;

		};


		this.encryptText = function(TEXT){

			if (!_.isString(TEXT)) return;

			var encrypted = '';

			for (var c=0; c< TEXT.length;c++){
				//var offset = (c%99);
				var offset = 1;
				encrypted+= String.fromCharCode(TEXT.charCodeAt(c)+offset);
			}

			return encrypted;
		};

		this.decryptText = function(TEXT){

			if (!_.isString(TEXT)) return;

			var decrypted = '';

			for (var c=0; c< TEXT.length;c++){
				//var offset = (c%99);
				var offset = 1;
				decrypted+= String.fromCharCode(TEXT.charCodeAt(c)-offset);
			}

			return decrypted;
		};

		return this;
		
	
	};


	//expose
	smx.Compiler = DocumentCompiler;




})(window,_,$,smx);