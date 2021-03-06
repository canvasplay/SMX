(function(win, smx){

//private aux debug system
var DEBUG = true; var LOG = function(str){ if (win.console&&win.console.log&&DEBUG) win.console.log('TRACKING: '+str) };



/**
 * SMX TrackManager class
 * @class TrackManager
 * @memberof smx.tracking
 * @param {Document} document
 */
var TrackManager = function(doc){

	//document
	if(!doc) return;

	//extend with Backbone Events
	_.extend(this, Backbone.Events);

	//ready flag
	this.ready = false;

	//set document
	this.document = doc;

	//set playhead
	this.playhead = doc.playhead;

	//trigger collection
	this.triggers = {};

	//ignore triggers flag, if true, triggers will be ignored
	this.ignore_triggers = false;

	//track collection
	this.collection = new Backbone.Collection();

	this.attrControllers = smx.tracking.attributes;

	this.initializeDocument(_.bind(function(){ this.setReady() },this));


	return this;

};

TrackManager.prototype.setReady = function(){

	this.ready = true;
	this.trigger('ready');

	return

};


TrackManager.prototype.initializeDocument = function(_callback){

	//Creates a track for all nodes in document with track attributes.
	//Any node could have a track except non smx nodes, so ignore any node
	//with `type` attribute defined different from smx
    var selector = '*:not([type!="smx"] *):not([type] *)';
    
    //get all smx nodes
	var nodes = this.document.find(selector);
	
	//add document node itself to list
	//nodes.unshift(this.document);

    //exclude nodes without any track-* attribute
    nodes = _.without(nodes, function(n){ return n.isTracking() });
    
	// create a track for each node
	for (var n=0; n<nodes.length; n++){

		var node = nodes[n];

		var attrs = node[0].attributes;

		//create empty object for tracking attributes
		var track_attrs = {};

		//add node id
		track_attrs.id = node.id;

		//add all attributes which names start with 'track-'
		for(var i = 0; i < attrs.length; i++) {
			var attr_name = attrs[i].name;
			var attr_value = attrs[i].value;
			if(attr_name.indexOf("track-") === 0){
				attr_name = attr_name.substr(6);
				track_attrs[attr_name] = attr_value;
			}
				
		}

		if (node.parent) track_attrs.parent = node.parent.id;

		//create a new Track with catched attributes
		var track = new Backbone.Model(track_attrs);

		//add just created to track to collection
		this.collection.add(track);

	}


	//set collection changes observer
	this.collection.on('change', this._onCollectionChange, this);

	//set playhead observers
	this.playhead.on('enter', this.onNodeEnter, this);
	this.playhead.on('exit', this.onNodeExit, this);

	//set timeline observers
	//this.playhead.on('timeline:enter', this.onTimelineNodeEnter, this);
	//this.playhead.on('timeline:exit', this.onTimelineNodeExit, this);
	//this.playhead.on('timeline:play', this.onTimelinePlay, this);
	//this.playhead.on('timeline:pause', this.onTimelinePause, this);
	//this.playhead.on('timeline:update', this.onTimelineUpdate, this);
	//this.playhead.on('timeline:finish', this.onTimelineFinish, this);


	this.setTriggers(_callback);


	return this;

};


TrackManager.prototype.setTriggers = function(_callback){


	var nodes = this.document.find('[track-trigger]:not([track-trigger-processed])');
	//if(this.document.has('track-trigger')) nodes.push(this.document);

	var parseTriggerExpression = function(exp){

		try{

			/*

				format like this
				
				on @ progress >= 100 ? tracking.set( this | status | 2 )
				once @ views == 1 ? tracking.set( next | access | 0 )
				...

			*/

			var parts = exp.split('@');

			//get method
			var method = parts[0];

			//get condition
			parts[1] = parts[1].split('?');
			var cond = parts[1][0];

				//get operator
				var known_operators = ['==','!=','>=','<=','=','>','<'];
				var match_cond = '';

				var o = 0;
				while(o<known_operators.length && match_cond == ''){

					var op = known_operators[o];
					if(cond.indexOf(op)!=-1) match_cond = op;

					o++;
				}

				var operator = match_cond.trim();

				var cond = cond.split(operator);

				var cond_a = cond[0];
				var cond_b = cond[1];


			//get callback
			var call = parts[1][1];

				var call_parts = call.split("(");
				var call_parts2 = call_parts[1].split(")");

				var call_name = call_parts[0];
				var call_args = call_parts2[0];

				call_args = call_args.split('|');
				_.each(call_args, function(item,index){call_args[index] = item.trim()})


			var trigger = {
				'method': method.trim(),
				'condition': {
					'key': cond_a.trim(),
					'operator': operator.trim(),
					'value': cond_b.trim()
				},
				'callback': {
					'name': call_name.trim(),
					'arguments': call_args
				}
			};

			return trigger;

		}
		catch(e){

			LOG('ERROR parsing track-trigger '+ exp);

			return;

		}

		return

	}



	var max_iterations = 10;
	var iterations = 0;

	for(var i=0; i<nodes.length && iterations<max_iterations; i++){

		var node = nodes[i];

		var trigger_attr = node.attr('track-trigger');

		var exps = trigger_attr.split(',');

		for(var e=0; e< exps.length; e++){
			
			//parse trigger expression
			var trigger = parseTriggerExpression(exps[e]);
			//LOG(trigger);

			//apply trigger
			this.setTrigger(node,trigger);

		}

		node[0].setAttribute('track-trigger-processed','true')

		iterations++;

	}


	LOG('SETTING UP TRACK TRIGGERS!');

	var __callback = (_callback)? _callback : function(){};

	if(iterations<nodes.length) _.delay(_.bind(function(){
		this.setTriggers(__callback);
	},this),0);
	else _callback();

	return;

};


TrackManager.prototype.setTrigger = function(node, trigger){

	//generate trigger GUID
	function s4(){ return Math.floor((1+Math.random())*0x10000).toString(16).substring(1)};
	function guid() { return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4() };

	//get new guid
	trigger.code = guid();

	//prevent duplicated triggers
	if(this.triggers[trigger.code]) return;

	//add trigger to trigger collection
	this.triggers[trigger.code] = trigger;



	if (!this.has(node.id,trigger.condition.key)) return;

	var callback = function(track){

		if(this.ignore_triggers) return;

		var val = this.get(node.id, trigger.condition.key);


		var v1 = val;
		var v2 = trigger.condition.value;
		var ev = '';

		//check for numeric operation and convert numbers
		if( trigger.condition.operator.indexOf('<')>=0 || trigger.condition.operator.indexOf('>')>=0 ){
			ev = '( parseFloat("'+v1+'") '+trigger.condition.operator+' parseFloat("'+v2+'") )';
		}
		else{
			ev = '( "'+v1+'" '+trigger.condition.operator+' "'+v2+'" )';
		}

		var result = eval(ev);

		if(result){


			if ((trigger.callback.name).indexOf('playhead')===0){

				try{

					//var playhead = this.playhead;
					var CALLBACK = trigger.callback.name;

					_.defer(function(){ eval(CALLBACK+'()') });

				}
				catch(e){}

			}
			else{

				if (trigger.callback.name=='tracking.set'){

					var args = trigger.callback.arguments;

					var alias = ['next','previous','parent','first','last','root'];
					var id = args[0];
					var target = id+"";
					if(_.includes(alias,id)) target = node[id]();
					else if(id=='this') target = node.id;
					else if(!_.isString(target)) target = target.id;

					//normalize target as id (String)
					if (target && target.id) target = target.id;

					
					//aliased?? wtf!?
					//var value_aliased = this.get(node.id,expval);
					//if(value_aliased) args[2] = value_aliased;


					//eval!!!
					var exp = (args[2] +'').trim();
					var fn = new Function('value','var v;try{v=('+ exp +')}catch(e){}return v;');
					var expval = fn(v1);

					if (target) this.set(target, args[1], expval, args[3] || false);

					LOG(target+' '+args[1]+' '+expval+' '+ (args[3] || false ));

				}
				else if(trigger.callback.name=='tracking.propagate'){

					var args = trigger.callback.arguments;

					var alias = ['next','previous','parent','first','last','root'];
					var id = args[0];
					var target = id+"";
					if(_.includes(alias,id)) target = node[id]();
					else if(id=='this') target = node.id;
					else if(!_.isString(target)) target = target.id;

					if (target && target.id) target = target.id;
					if (target) this.propagate(target);

				}



			}

		}

	}


	var event_name = 'change:'+node.id+':'+trigger.condition.key +'';

	this.on(event_name, callback);

};


/*
TrackManager.prototype.unsetTrigger = function(code){


}
*/


/**
 *	Get raw value for specified node id and attribute key
 *	Uses SMXNode 'raw' method
 *
 *  @param id {string} node id
 *  @param key {string} attribute key
 *  @return {string} resulting value or null
 *
 */

TrackManager.prototype.raw = function(id, key){

	//if bad params return undefined
	if (!id || !key) return;

	//get node by id
	var node = this.document.getNodeById(id);

	//if not found node return undefined
	if (!node) return;

	//return value or undefined
	return node.attr('track-'+ key);

};


/**
 * Answer this question:
 * Has key attribute the node with give id?
 * @param {String} id  - node id
 * @param {String} key - attribute key
 * @return {Boolean} has or not the specified key
 *
 */

TrackManager.prototype.has = function(id, key){

	//if bad params return false
	if (!id || !key) return false;

	//get node by id
	var node = this.document.getNodeById(id);

	//if not found node return false
	if (!node) return false;

	//get raw value by key
	var value = node.attr('track-'+ key);

	//raw will always return String or null value
	return (_.isString(value))? true : false;

};


TrackManager.prototype.get = function(id, key, format){

	//if bad params return undefined
	if (!id || !key) return;

	//get track by id
	var track = this.collection.get(id);

	//if not found track return undefined
	if (!track) return;

	//if track has no key attr return undefined
	if (!this.has(id,key)) return;

	//get attr controller
	var attrController = this.attrControllers[key];

	//get value
	var value;

	//if exists attr controller and has get method use it
	//else use default get method
	if(attrController && attrController.get) 	value = attrController.get(track, this, format);
	else 										value = track.get(key);

	//return resultant value
	return value;

};



TrackManager.prototype.set = function(id, key, value, propagate, recursive){

	//if bad params exit
	if (!id || !key || typeof value == 'undefined') return;

	//get track by id
	var track = this.collection.get(id);

	//if not found track exit
	if (!track) return;

	//if track has no key attr exit
	if (!this.has(id,key)) return;

	//get attr controller
	var attrController = this.attrControllers[key];

	var val;

	//if exists attr controller and has set method use it
	//else use default set method
	if(attrController && attrController.set)	val = attrController.set(value, track, this);
	else										val = track.set(key, value);

	if(propagate) this.propagate(id,key,recursive);

	return val;

};


/**
* Updates tracking data for the given node id
* @param {String} id - node id
* @param {String=} key - tracking field key name
*/
TrackManager.prototype.update = function(id, key){

	var tracks;
	
	//get track by given id
	var track = this.collection.get(id);

	//single track or all tracks?
	tracks = (track)? [track] : this.collection.models;

	//loop collection in reverse oreder
	//tracks always are added sequentially from document tree
	//tracks are processed from outter to inner in tree so...
	//reversed iteration will update from inner to outter in tree
	//like this we dont need to also propagate tracks

	//update selected tracks
	for (var x=tracks.length-1; x>=0; x--){

		track = tracks[x];

		//single key or all keys?
		var keys = (key)? [key] : _.keys(track.attributes);

		//update selected keys
		for(var i=0;i<keys.length;i++){
			var handler = this.attrControllers[keys[i]];
			if(handler && handler.update) handler.update(track, this);
		}

	}

	return;

};

/**
* Propagates tracking data for the given node id
* @param {String} id - node id
* @param {String=} key - tracking field key name
* @param {String=} [recursive=false]
*/

TrackManager.prototype.propagate = function(id, key, recursive){

	//get track by given id
	var track = this.collection.get(id);

	//no track?
	if (!track) return;

	//updating keys array
	var keys = [];

	//given key? else use all keys,
	if (key) 	keys.push(key);
	else		keys = _.keys(track.attributes);

	//propagate needed keys
	for(var i=0;i<keys.length;i++){
		var handler = this.attrControllers[keys[i]];
		if(handler && handler.propagate) handler.propagate(track, this, recursive);
	}

	return;

};

/**
 * Generic handler for track collection changes
 * @name _onCollectionChange
 * @private
 * @memberof smx.tracking.TrackManager
 * @param {Track} track
 * @listens collection!change
 * @fires change
 * @fires change:id
 * @fires change:id:key
 */
TrackManager.prototype._onCollectionChange = function(track){

	
	if(track.changed){

		//var previous = track.previousAttributes();

		var keys = _.keys(track.changed);

		/*
		for (var i=0; i< keys.length; i++){

			var previous_value = track.changed[keys[i]];

			//log it
			//LOG('#'+track.id + '@'+keys[i]+': '+ previous_value +' -> '+ track.get(keys[i]));

			//call bubblers
			var handler = this.attrControllers[keys[i]];
			if(handler.propagate){
				handler.propagate(track, this, previous[keys[i]],previous_value);
			}

		}
		*/

		for (var i=0; i< keys.length; i++){

			//fire track-key change event
			var strEvent = 'change:'+ track.id +':'+keys[i];
			this.trigger(strEvent,track);

		}

		//fire track change event
		var strEvent = 'change:'+ track.id;
		this.trigger(strEvent,track);

	}

	//fire generic tracking change event
	this.trigger('change',track);
	

	return;

};

/*

TrackManager.prototype.checkBinds = function(node,key,value){
	
}

*/




////////////////////////////////
// PLAYHEAD EVENT HANDLERS

TrackManager.prototype.onNodeEnter = function(node){

	if (!node || !node.id) return;

	//get track by node.id
	var track = this.collection.get(node.id);

	//valid track is required
	if(!track) return;


	if( this.has(node.id,'status') && this.get(node.id,'status')<1 )
		this.set(node.id,'status', 1);


	//propagate recursively
	this.update(node.id);

	return;

};

TrackManager.prototype.onNodeExit = function(node){

	/*

	//this is handler for 2 events
	//1 - timeline event, recives event object
	//2- playhead event, node

	var node = (event.target)? event.target : event;

	//get track by node.id
	var track = this.collection.get(node.id);

	//valid track is required
	if(!track) return;


	var keys = _.keys(this.attrControllers);

	for (var i=0;i<keys.length;i++){
		if(this.attrControllers[keys[i]].onexit) this.attrControllers[keys[i]].onexit(track,this,event);
	}

	*/

	//propagate recursively
	this.propagate(node.id,null, true,true);

	return;

};

TrackManager.prototype.onTimelineNodeEnter = function(evt){

	if (!evt || !evt.target) return;

	//get id
	var id = evt.target.id;

	//get track by node.id
	var track = this.collection.get(id);

	//valid track is required
	if(!track) return;


	if( this.has(id,'status') && this.get(id,'status')<1 )
		this.set(id,'status', 1);


	return;

};

TrackManager.prototype.onTimelineNodeExit = function(evt){

	if (!evt || !evt.target) return;

	//get id
	var id = evt.target.id;

	//get track by node.id
	var track = this.collection.get(id);

	//valid track is required
	if(!track) return;


	if( this.has(id,'status') && this.get(id,'status')<2 )
		this.set(id,'status', 2);


	return;

};

TrackManager.prototype.onTimelinePlay = function(event){

	/*
	//this is handler for 2 events
	//1 - timeline event, recives event object
	//2- playhead event, node

	var node = (event.target)? event.target : event;

	//get track by node.id
	var track = this.collection.get(node.id);

	//valid track is required
	if(!track) return;


	var keys = _.keys(this.attrControllers);

	for (var i=0;i<keys.length;i++){
		if(this.attrControllers[keys[i]].onplay) this.attrControllers[keys[i]].onplay(track,this,event);
	}
	*/

	return;

};

TrackManager.prototype.onTimelinePause = function(event){

	/*

	//this is handler for 2 events
	//1 - timeline event, recives event object
	//2- playhead event, node

	var node = (event.target)? event.target : event;

	//get track by node.id
	var track = this.collection.get(node.id);

	//valid track is required
	if(!track) return;


	var keys = _.keys(this.attrControllers);

	for (var i=0;i<keys.length;i++){
		if(this.attrControllers[keys[i]].onpause) this.attrControllers[keys[i]].onpause(track,this,event);
	}

	*/
	return;

};


TrackManager.prototype.onTimelineUpdate = function(event){

	var node = (event.target)? event.target : event;

	var progress = parseInt(event.progress);

	var previous_progress = node.track('progress','value');

	if(progress>previous_progress)
		this.set(node.id,'progress', progress);

	return;

};

TrackManager.prototype.onTimelineFinish = function(event){

	var node = (event.target)? event.target : event;

	//PROGRESS 100%
	this.set(node.id,'progress', 100);

	//STATUS COMPLETED
	if( this.has(node.id,'status') && this.get(node.id,'status')<2 )
		this.set(node.id,'status', 2);

	return;

};





/**
 *	EXPORT + IMPORT
 *
 */


TrackManager.prototype.dictionary = {
	'id': 		'a',
	'status': 	'b',
	'progress': 'c',
	'points': 	'd',
	'access': 	'e'
};


TrackManager.prototype.exportsCode = function (options){

	var data = this.exports({
		'format':'json',
		'onlychanged': true,
		'singlequotes': false
	});

	if(!data || !data.length) return '';

	var str = '';

	var codes = {
		'id': 		'#',
		'status': 	'!',
		'progress': '%',
		'points': 	'$',
		'score': 	'@',
		'access': 	'·'
	};


	for(var i=0; i<data.length; i++){

		var item = data[i];
	
		var keys = _.keys(item);
		var values = _.values(item);


		for(var n = 0; n<keys.length;n++){

			var k = keys[n];
			var v = values[n];

			if(codes[k]) str+=codes[k]+v;

		}

	}

	return str;

}

/**
 * Exports tracking data
 * @param {Object=} options
 * @return {Object} data
 */
TrackManager.prototype.exports = function (options){
	
	var defaults = {
		'node': null, // node to use as root
		'format':'json', // output format ['json'|'text']
		'onlychanged': false,	// if true will only return changed attributes
		'codify': false	// if true will use dictionary
	}

	options = _.extend(defaults,options||{});

	var myJSON = [];

	var myDictionary = this.dictionary;

	var _this = this;


	this.collection.each(function(item,index){


		var node = _this.document.getNodeById(item.id);

		if (options.node){

			if ( node.isChildOf(options.node) || options.node.id == node.id ){

			}
			else return;

		}


		var isTracking = node.isTracking();

		var obj = {};



		var keys = _.keys(item.attributes);


		//add id property

		if (options.codify && myDictionary['id']) myDictionary['id'] = item.id;
		else obj.id = item.id;


		for (var a =0; a<keys.length; a++){

			var key = keys[a];

			var raw_value = _this.attr(item.id, key);
			var value = _this.attr(item.id, key);

			if (!options.onlychanged){

				if (options.codify && myDictionary[key]){
					obj[myDictionary[key]] = item.attributes[key];
				}
				else{
					obj[key] = item.attributes[key];
				}

			}
			else{

				if(!_.isUndefined(raw_value) && raw_value!='none' && raw_value!='auto'){

					if(key=='score'){

						if(raw_value[0]!=value){

							if (options.codify && myDictionary[key]){
								obj[myDictionary[key]] = value;
							}
							else{
								obj[key] = value;
							}

						}

					}
					else{

						if(value!=raw_value){

							if (options.codify && myDictionary[key]){
								obj[myDictionary[key]] = value;
							}
							else{
								obj[key] = value;
							}

						}

					}


				}
			}

		}


		//add obj to json
		if (!options.onlychanged) myJSON.push(obj);
		else
			if (_.size(obj)>1) myJSON.push(obj);


	});

	//process return value
	if (options.format == 'text'){

		myJSON = JSON.stringify(myJSON);

		//convert doble quotes into single quotes
		if(options.singlequotes)
			myJSON = myJSON.replace(/"/g, '\'');
	}

	return myJSON;


};


/**
 * Imports tracking data
 * @param {Object|String} data
 * @return {data}
 */
TrackManager.prototype.imports = function(_data_){
	
	//no JSON?
	if (!_data_ || !_.isObject(JSON)) return;

	//process input param into data object
	var data = null;

	try{
		if (typeof _data_ == 'string' && _data_!=''){
			data = eval( '('+ _data_ +')' );
		}
		else{
			data = _data_;
		}
	}
	catch(e){}

	//no valid data?
	if (!data || _.isEmpty(data)) return;


	var len = _.size(data);



	//reverse array, getting inner to outter nodes order
	//data = data.reverse();


	//deactivate triggers while merging new data
	this.ignore_triggers = true;


	for (var i=len-1; i>-1;i--){

		//try apply processed data
		try{

			var item = data[i];

			var track = this.collection.get(item.id);

			var keys = _.keys(item);

			for (var a =0; a<keys.length; a++){

				var key = keys[a];
				if(key!='trigger' && key!='id'){

						if (!_.isUndefined(item[key])){
							//track.set(key, item[key], {'silent':true});
							this.set(item.id, key, item[key]);
						}
						
				}


			}

			LOG('RESTORE :' + item.id);

			//this.update(item.id);
			//this.propagate(item.id,null,true);

			//this.update();

		}
		catch(e){
			return e;
		}

	}

	//re activate triggers
	this.ignore_triggers = false;

	this.update();

};




/**
 * Fired when any track changes any of its fields
 * @event change
 * @memberof smx.tracking.TrackManager
 * @return {object}
 */

/**
 * Fired when the id track changes any of its fields
 * @event change:id
 * @memberof smx.tracking.TrackManager
 * @return {object}
 */

/**
 * Fired when the id track changes the key field
 * @event change:id:key
 * @memberof smx.tracking.TrackManager
 * @return {object}
 */

 
//expose
smx.tracking.TrackManager = TrackManager;


})(window, window.smx);