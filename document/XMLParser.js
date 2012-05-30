/**
 * GecCast HTML5 2012
 * XML PARSER
 */

SMX.document.XMLParser = new JS.Class({

	xmlData : null,

	initialize : function(){
	
		this.xmlData = null;
	
	},
	
	parseDocument : function(xml){
	
		//assign xmlData
		this.xmlData = $(xml);
		
		//create document object
		var doc = new SMX.document.Document();

		//interpret content childnodes
		var content_blocks = $($(xml).find('content')[0]).children();
		for (var n =0; n<content_blocks.length;n++){

			var _node = content_blocks[n];
			var _obj = this.parseNode(_node);
			doc.content.addChildNode(_obj);
			
		}
		
		//return document object
		return doc;
	
	},
	
	parseNode : function(_node){
	
		// 0. DECLARE NODE OBJECT
		var _obj = null;

		// 1. GET NODE TAG
		var _nodeName = (_node.nodeName+'').toUpperCase();
		
		// 2. CREATE SPECIFIC NODE OBJECT
		switch (_nodeName){
			case '#DOCUMENT':
			
			break;
			
				case 'PREFERENCES':
				
				break;
				
				case 'CONTENT':
					
				break;
				
					case 'BLOCK':
						_obj = new SMX.document.Block();
					break;
					
					case 'STAGE':
						_obj = new SMX.document.Stage();
					break;

					case 'SCENE':
						_obj = new SMX.document.Scene();
					break;
					
					case 'MEDIA':
					case 'AUDIO':
					case 'SLIDESHOW':
						_obj = new SMX.document.Media();
						_obj.nodeName = _nodeName;
						_obj.duration = this.parseAttrTime($(_node).attr('duration')) || _obj.duration;
						_obj.startTime = this.parseAttrTime($(_node).attr('startTime')) || _obj.startTime;
						
					break;
					case 'HTML':
						_obj = new SMX.document.MediaHtml();
						_obj.duration = this.parseAttrTime($(_node).attr('duration')) || _obj.duration;
						_obj.src = $(_node).attr('src') || '';
					break;
					case 'VIDEO':
						_obj = new SMX.document.MediaVideo();
						_obj.videoId = $(_node).attr('videoId') || '';
						_obj.sourceType = $(_node).attr('sourceType') || '';
						_obj.duration = this.parseAttrTime($(_node).attr('duration')) || _obj.duration;
						_obj.startTime = this.parseAttrTime($(_node).attr('startTime')) || _obj.startTime;
						_obj.aspectRatio = $(_node).attr('aspectRatio') || _obj.aspectRatio;
						_obj.isTimer = $(_node).attr('isTimer') || null;
					break;
					case 'TIMEMARKER':
						_obj = new SMX.document.TimeMarker();
					break;
					case 'TIMEMARK':
						_obj = new SMX.document.TimeMark();
						_obj.duration = this.parseAttrTime($(_node).attr('duration')) || _obj.duration;
						_obj.startTime = this.parseAttrTime($(_node).attr('startTime')) || _obj.startTime;
					break;
					
			
			case '#COMMENT':
			case '#TEXT':
			case '#CDATA-SECTION':
				//do nothing
				//console.log('IGNORED XML NODE: '+_nodeName);
			break;
			
			default:
				//console.log(_nodeName);
			break;
			
		}
		
		// 3. RETURN (AND IGNORE NODE) IF UNDEFINED NODENAME
		if (!_obj) return;
		
		
		// 4. PARSE NODE ATTRIBUTES
			
			// 4.1. GET NODE ID
			_obj.id = this.parseAttrId(_node);

			// 4.2 GET NODE METADATA
			_obj.meta = this.parseMetadata(_node);
			
			// 4.3 GET NODE PATH
			_obj.path = $(_node).attr('path') || '';

			// 4.3 GET NODE TEMPLATE
			_obj.template = $(_node).attr('template') || null;
			
			// 4.3 GET NODE STYLE
			_obj.style = $(_node).attr('style') || null;

			// 4.3 GET NODE TAGS
			var tags = $(_node).attr('tags') || '';
			_obj.tags = (tags!='')? tags.split(' ') : [];

			
		// 5. RECURSIVE CHILD NODES PARSING
		var _children = $(_node).children();
		console.log(_nodeName+': '+ $(_node).attr('title') + ' ['+  $(_node).children().length +']');
		for (var c=0; c < _children.length; c++){
			var _childNode = _children[c];
			
			if (_nodeName == 'SCENE'){
				var _childNodeName = (_childNode.nodeName+'').toUpperCase();
				if( _childNodeName != 'BLOCK' && _childNodeName != 'SCENE' ){
					var _childNodeObject = this.parseNode(_childNode);
					_obj.addChildNode(_childNodeObject);
				}
				else{
					$('#gch5-initialize .status').append('<li class="warning">XML WARNING: '+ _childNodeName +' cant be child of SCENE, node ignored!<li>');
				}
			}
			else{
			
				var _childNodeObject = this.parseNode(_childNode);
				_obj.addChildNode(_childNodeObject);
			}
			
		}
		
		// 6. RETURN NODE OBJECT
		return _obj;
		
	},
	
	

	/* PARSING SPECIFIC NODES */
	
	
	
	
	
	
	/* PARSING SPECIFIC ATTRIBUTES */
	
	
	/**
     * extractMetadata
     * @param {XMLNode} XMLNode which extract metadata of
     * @return {Boolean} Metadata Object
     */
	parseMetadata : function(_node){
	
		var metadata = new SMX.document.Metadata();
		
		
		metadata.title = $(_node).attr('meta-title') || null;
		metadata.subtitle = $(_node).attr('meta-subtitle') || null;
		metadata.description = $(_node).attr('meta-description') || null;
		metadata.image = $(_node).attr('meta-image') || null;
		metadata.thumbnail = $(_node).attr('meta-thumbnail') || null;
		metadata.file = $(_node).attr('meta-file') || null;
		
		
		return metadata;
		
	},
	

	/**
     * parseAttrId
     */
	parseAttrId : function(_node){
		var id = $(_node).attr('id') || null;
		if(!id) id=''+this.getUniqueTimestampId();
		return id;
	},
	
	getUniqueTimestampId : function() {
		var time = new Date().getTime();
		while (time == new Date().getTime());
		return new Date().getTime();
	},


	/**
     * parseAttrTime
     */
	parseAttrTime : function(_value){
	
		if (!_value) return null;
		if (_value.indexOf(':')){
		
			var sum = 0;
			var factor = 1;
			var values=(_value).split(':');
			values.reverse();
			for (var v in values){
				sum += parseInt(values[v])*factor;
				factor = factor*60;
			}
			return sum;
		
		
		}
		else{
			return parseInt(_value);
		}
		
	}
	
	


});

