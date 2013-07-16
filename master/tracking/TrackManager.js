(function(smx){


	var TrackManager = function(doc){

		//document && playhead params are required
		if(!doc) return;

		//extend with Backbone Events
		_.extend(this, Backbone.Events);

		//set document
		this.document = doc;

		//set playhead
		this.playhead = this.document.playhead;

		//trigger collection
		this.triggers = {};

		//track collection
		this.collection = new Backbone.Collection();

		this.attrControllers = smx.tracking.attributes;

		this.initializeDocument();

		return this;

	};

	TrackManager.prototype.initializeDocument = function(){

		//get the nodes that will have a track
		//actually whole document content nodes
		var nodes = this.document.find('*');
		
		//add document node itself to list
		nodes.unshift(this.document);

		// create a track for each node
		for (var n=0; n<nodes.length; n++){

			var node = nodes[n];

			var is_tracking = node.isTracking();

			if (is_tracking){

				var attrs = node[0].attributes;

				//create empty object for tracking attributes
				var track_attrs = {};

				//add node id
				track_attrs.id = node.id;

				//add all attributes which names start with 'track-' 
				for(var i = 0; i < attrs.length; i++) {
					var attr_name = attrs[i].name;
					var attr_value = attrs[i].value;
					if(attr_name.indexOf("track-") == 0){
						attr_name = attr_name.substr(6);
						track_attrs[attr_name] = attr_value;
					}
						
				}

				if (node.parent()) track_attrs.parent = node.parent().id;

				//create a new Track with catched attributes
				var track = new smx.tracking.Track(track_attrs);

				//add just created to track to collection
				this.collection.add(track);


			}


		}


		//set collection changes observer
		this.collection.on('change',_.bind(this.onCollectionChange,this));

		//set playhead observers
		this.playhead.on('enter',_.bind(this.onNodeEnter,this));
		this.playhead.on('exit',_.bind(this.onNodeExit,this));

		//set timeline observers
		this.playhead.on('timeline:enter',_.bind(this.onNodeEnter,this));
		this.playhead.on('timeline:exit',_.bind(this.onNodeExit,this));
		this.playhead.on('timeline:play',_.bind(this.onTimelinePlay,this));
		this.playhead.on('timeline:pause',_.bind(this.onTimelinePause,this));
		this.playhead.on('timeline:update',_.bind(this.onTimelineUpdate,this));


		this.setTriggers();


		return this;

	};


	TrackManager.prototype.setTriggers = function(){


		var nodes = this.document.find('[track-trigger]');


		var parseTriggerExpression = function(exp){

			try{

				//once @ views == 1 ? tracking.set( next | access | 0 ),

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

				console.log('ERROR parsing track-trigger '+ exp);

				return null;

			}



		}



		for(var i=0; i< nodes.length; i++){

			var node = nodes[i];

			var trigger_attr = node.attr('track-trigger');

			var exps = trigger_attr.split(',');

			for(var e=0; e< exps.length; e++){
				
				//parse trigger expression
				var trigger = parseTriggerExpression(exps[e]);
				console.log(trigger);

				//apply trigger
				this.setTrigger(node,trigger);

			}


		}


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

			var val = this.get(node.id, trigger.condition.key);

			var ev = '"'+val+'" '+trigger.condition.operator+' "'+trigger.condition.value+'"';

			var result = eval(ev);

			if(result){

				var args = trigger.callback.arguments;

				var alias = ['next','previous','parent'];
				var id = args[0];
				var target = id+"";
				if(_.contains(alias,id)) target = node[id]();
				if(!_.isString(target)) target = target.id;

				if (target){

					this.set(target, args[1], args[2]);


				}

				console.log(trigger);					

			}

		}


		var event_name = 'change:'+node.id+':'+trigger.condition.key +'';

		this.on(event_name, callback);

	};

	TrackManager.prototype.unsetTrigger = function(code){

		if (!manager.has(node.id,trigger.condition.key)) return;

		var callback = function(track){

			var val = manager.get(node.id, trigger.condition.key);

			var ev = '"'+val+'" '+trigger.condition.operator+' "'+trigger.condition.value+'"';

			var result = eval(ev);

			if(result){

				var args = trigger.callback.arguments;

				var alias = ['next','previous','parent'];
				var id = args[0];
				var target = id+"";
				if(_.contains(alias,id)) target = node[id]();
				if(!_.isString(target)) target = target.id;

				if (target){

					manager.set(target, args[1], args[2]);


				}

				console.log(trigger);					

			}

		}


		var event_name = 'change:'+node.id+':'+trigger.condition.key +'';

		manager.on(event_name, callback);

	}


	/**
	 *	Get raw value for specified node id and attribute key
	 *	Uses SMXNode 'raw' method
	 *
     *  @method raw
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
		return node.raw('track-'+ key);

	};


	/**
	 *	Answer this question:
	 *	Has key attribute the node with give id?
	 *
     *  @method has
     *  @param id {String} node id
     *  @param key {String} attribute key
     *  @return {Boolean} has or not the specified key
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
		var value = node.raw('track-'+ key);

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

	TrackManager.prototype.set = function(id, key, value){

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

		//if exists attr controller and has set method use it
		//else use default set method
		if(attrController && attrController.set)	return attrController.set(value, track, this);
		else										return track.set(key, value);

	};



	TrackManager.prototype.update = function(id, key){

		var tracks;
		
		//get track by given id
		var track = this.collection.get(id);

		//single track or all tracks?
		tracks = (track)? [track] : this.collection.models;

		//reverse collection
		//if tracks were added sequentially from document tree
		//reversing collection will update from inner to outter in tree
		//like this we dont need to also propagate tracks
		tracks = tracks.reverse();

		//update selected tracks
		for (var x=0; x< tracks.length; x++){

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


	TrackManager.prototype.onCollectionChange = function(track){

		
		if(track.changed){

			var previous = track.previousAttributes();

			var keys = _.keys(track.changed);

			/*
			for (var i=0; i< keys.length; i++){

				var previous_value = track.changed[keys[i]];

				//log it
				//console.log('#'+track.id + '@'+keys[i]+': '+ previous_value +' -> '+ track.get(keys[i]));

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


	TrackManager.prototype.checkBinds = function(node,key,value){




	}





    ////////////////////////////////
    // PLAYHEAD EVENT HANDLERS

	TrackManager.prototype.onNodeEnter = function(node){

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
			if(this.attrControllers[keys[i]].onenter) this.attrControllers[keys[i]].onenter(track,this,event);
		}

		*/


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
		this.propagate(node.id,null, true);

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

		/*
		//this is handler for 2 events
		//1 - timeline update event, recives event object
		//2 - playhead update event, node

		var node = (event.target)? event.target : event;

		//get track by node.id
		var track = this.collection.get(node.id);

		//valid track is required
		if(!track) return;


		var keys = _.keys(this.attrControllers);

		for (var i=0;i<keys.length;i++){
			if(this.attrControllers[keys[i]].onupdate) this.attrControllers[keys[i]].onupdate(track,this,event);
		}

		*/
		return;

	};





	/*
		JSON IO API

	*/

	TrackManager.prototype.toJSON = function (options){
		
		var defaults = {
			'format':'json', // output format ['json'|'text']
			'onlychanged': false	// if true will only return changed attributes
		}

		options = _.extend(defaults,options);

		var myJSON = [];

		var _this = this;
		this.collection.each(function(item,index){

			var node = _this.document.getNodeById(item.id);

			var isTracking = node.isTracking();

			var obj = {};


			obj.id = item.id;


			//ACCESS
			var access_raw = _this.raw(item.id, "access");
			var access = _this.get(item.id, "access");

			if (!options.onlychanged) obj["access"] = access;
			else
				if(!_.isUndefined(access_raw) && access_raw!='none' && access_raw!='auto')
					if(access>0 && access!=access_raw)
						obj["access"] = access;			


			//VIEWS
			var views_raw = _this.raw(item.id, "views");
			var views = _this.get(item.id, "views");

			if (!options.onlychanged) obj["views"] = views;
			else
				if(!_.isUndefined(views_raw) && views_raw!='none')
					if(views>0 && views!=views_raw)
						obj["views"] = views;

			//PROGRESS
			var progress_raw = _this.raw(item.id, "progress");
			var progress = _this.get(item.id, "progress");

			if (!options.onlychanged) obj["progress"] = progress;
			else
				if(!_.isUndefined(progress_raw) && progress_raw!='none' && progress_raw!='auto')
					if(progress!=progress_raw  && progress>0)
						obj["progress"] = progress;

			//SCORE
			var score_raw = _this.raw(item.id, "score");
			var score = _this.get(item.id, "score",'string');

			if (!options.onlychanged) obj["score"] = score;
			else
				if(!_.isUndefined(score_raw) && score_raw!='none' && score_raw!='auto')
					if(score!=score_raw)
						obj["score"] = score;

			//STATUS
			var status_raw = _this.raw(item.id, "status");
			var status = _this.get(item.id, "status");

			if (!options.onlychanged) obj["status"] = status;
			else
				if(!_.isUndefined(status_raw) && status_raw!='none' && status_raw!='auto')
					if(status>0 && status!=status_raw)
						obj["status"] = status;


			//add obj to json
			if (!options.onlychanged) myJSON.push(obj);
			else
				if (_.size(obj)>1) myJSON.push(obj);


		});

		//process return value
		if (options.format == 'text') myJSON = JSON.stringify(myJSON);

		return myJSON;


	};

	TrackManager.prototype.toJSONString = function (options){

		var myJSON = this.toJSON(options);
		return JSON.stringify(myJSON);
	};

	TrackManager.prototype.setJSON = function (myJSON){
		
		//no input param?
		if (!myJSON) return;

		//process input param into data object
		var data = null;

		try{
			if (typeof myJSON == 'string' && myJSON!=''){
				data = eval( '('+ myJSON +')' );
			}
			else{
				data = myJSON;
			}
		}
		catch(e){}

		//no valid data?
		if (!data) return;


		var len = _.size(data);
		for (var i=len-1; i>-1;i--){
			//try apply processed data
			try{

				var item = data[i];

				var track = this.collection.get(item.id);

				
				if (item.access) 	track.set('access', item.access, {'silent':true});
				if (item.views) 	track.set('views', item.views, {'silent':true});
				if (item.progress) 	track.set('progress', item.progress, {'silent':true});
				if (item.score) 	track.set('score', item.score, {'silent':true});
				if (item.status) 	track.set('status', item.status, {'silent':true});
				

				console.log('RESTORE :' + item.id);

			}
			catch(e){
				return e;
			}

		}



	};



	//expose
	smx.tracking.TrackManager = TrackManager;


})(window.smx);