/**

Track Attributes
@module Track Attributes

*/


define([
],
function(){

	var SMXTrackAttribute = function(val){

		//wont create new instance for invalid values
		if(_.isUndefined(val) || _.isNaN(val) || _.isNull(val)) return;

		//but will for "none" values???


		//attribute value is always treated as string
		val = val+'';

		//original value for this instance
		//setted only once when creating the object
		this.o = val;

		this.value = val;

		return this;

	};

	SMXTrackAttribute.prototype.name = 'base';

	SMXTrackAttribute.prototype.defaults = '0';

	SMXTrackAttribute.prototype.get = function(format){


	};

	SMXTrackAttribute.prototype.set = function(val, important){


		//invalid values are taken as a manual attribute
		if(_.isUndefined(val) || _.isNaN(val) || _.isNull(val)) return true;

	};



	SMXTrackAttribute.prototype.update = function() {

		//if is calculated attribute recalculate it



	};


	SMXTrackAttribute.prototype.interpolate = function(attrs) {

		/*

			this function should be called once per change...

			will interpolate this attribute with other related attributes
			(usually node is the owner of this attribute)
			interpolation rules are defined in extended attribute

			e.g.: progress attribute

			if(!_.isUndefined(attrs['status'])){
	
				if(this.value>=100 && attrs['status']<STATUS.COMPLETED)


			}


		*/

	};

	SMXTrackAttribute.prototype.propagate = function(track) {



	};


	SMXTrackAttribute.prototype.isComputed = function() {

		var val = this.value;

		//invalid values are no-computed attributes
		if(_.isUndefined(val) || _.isNaN(val) || _.isNull(val)) return false;

		//"none" values are taken as a manual attribute
		var none_values = ['none','undefined','null'];
		if (none_values.indexOf(val)>=0) return false;


		//check for known calculated values
		var calculated_values = ['auto','avg','sum'];
		if (calculated_values.indexOf(val)>=0) return true;


		//else is taken as selfdefined attribute
		return false;

	};



	////////////////////////////////
	// EXAMPLE
	////////////////////////////////

	var ExampleAttributeHandler = {

		'name': 'name',

		'default': 'name',

		'set':function(value, track, manager) {},

		'get':function(track, manager, format){},

		'onchange': function(track, manager){},

		'onenter': function(track, manager, playheadEvent){},

		'onexit': function(track, manager, playheadEvent){},

		'onupdate': function(track, manager, playheadEvent){},

		'onplay': function(track, manager, playheadEvent){},

		'onpause': function(track, manager, playheadEvent){}

	};




	////////////////////////////////
	// PROGRESS
	////////////////////////////////

	var SMXProgressProperty = function(val){

		this.value = val;

		this.raw = val;

		return this;

	};


	SMXProgressProperty.prototype.name = 'progress';

	SMXProgressProperty.prototype.defaults = '0';

	SMXProgressProperty.prototype.get = function(format){

		var val = track.get(this.name);

		switch(format){
			case 'raw':		
				return this.raw;
			break;
			case 'text':
				return this.value+'%';
			break;
			case 'code':
			case 'value':
			default:
				return this.value;
			break;
		}

	};


	SMXProgressProperty.prototype.set = function(value, important){

		//numeric value is required
		if(!_.isNumber(parseInt(value))) return;

		//prepare recived value
		var val = parseInt(value);
		if(val>100) val=100;
		if(val<0) val=0;
		
		//get current value
		var cval = parseInt(track.get('progress'));

		//determine if represents value change
		var is_change = (val>cval)? true : false;


		if(is_change){

			var resultant_status = STATUS.INCOMPLETE;

			//apply new value silently
			if(is_change) track.set({'progress':val},{'silent':true});

		
			//progress directly modify 'status'
			if(val >= 100){

				resultant_status = STATUS.COMPLETED;

				/*
				if(track.get('status')<STATUS.COMPLETED){

					var score = parseScoreString(track);
					if (!score || score=='none' || score=='auto'){
						resultant_status = STATUS.PASSED;
					}
					else{
						if(score.min === 0) 				resultant_status = STATUS.PASSED;
						else if(score.value>=score.min) 	resultant_status = STATUS.PASSED;
						else 								resultant_status = STATUS.FAILED;
					}

				}
				*/

			}
			else if(val > 0){
				if(track.get('status')<STATUS.INCOMPLETE)
					resultant_status = STATUS.INCOMPLETE;
			}

			track.set({'status':resultant_status},{'silent':true});

		}



		//realease 'change' track event
		track.change();

		//return resulting value
		return val;


	};

	//will cause internal changes
	SMXProgressProperty.prototype.interpolate = function(track){


	};

	//propagate property to other tracks in given manager collection
	SMXProgressProperty.prototype.propagate = function(manager){


	};

	SMXProgressProperty.prototype.isAuto = function() {


	};


	SMXProgressProperty.prototype.update = function() {


	};


	AttributeHandlers.progress = {

		'name': 'progress',

		'defaults': 'progress',

		'get': function(track, manager, format){

			var val = track.get(this.name);

			switch(format){
				case 'raw':		
					var node = manager.document.getNodeById(track.id);
					val = node[0].getAttribute('track-'+this.name);
				break;
				case 'text':
					val = val+'%';
				break;
				case 'value':
				default:
				break;
			}

			return val;

		},

		'set': function(value, track, manager) {

			//numeric value is required
			if(!_.isNumber(parseInt(value))) return;

			//prepare recived value
			var val = parseInt(value);
			if(val>100) val=100;
			if(val<0) val=0;
			
			//get current value
			var cval = parseInt(track.get('progress'));

			//determine if represents value change
			var is_change = (val>cval)? true : false;


			if(is_change){

				var resultant_status = STATUS.INCOMPLETE;

				//apply new value silently
				if(is_change) track.set({'progress':val},{'silent':true});

			
				//progress directly modify 'status'
				if(val >= 100){

					resultant_status = STATUS.COMPLETED;

					/*
					if(track.get('status')<STATUS.COMPLETED){

						var score = parseScoreString(track);
						if (!score || score=='none' || score=='auto'){
							resultant_status = STATUS.PASSED;
						}
						else{
							if(score.min === 0) 				resultant_status = STATUS.PASSED;
							else if(score.value>=score.min) 	resultant_status = STATUS.PASSED;
							else 								resultant_status = STATUS.FAILED;
						}

					}
					*/

				}
				else if(val > 0){
					if(track.get('status')<STATUS.INCOMPLETE)
						resultant_status = STATUS.INCOMPLETE;
				}

				track.set({'status':resultant_status},{'silent':true});

			}



			//realease 'change' track event
			track.change();

			//return resulting value
			return val;

		},

		'refresh': function(track, manager){

			//get reffering node
			var node = manager.document.getNodeById(track.id);

			if (node.hasChilds() && !node.isTimeline()){

				var childs = node.children();

				var d = 0, t = 0;
				for (var i=0; i< childs.length;i++){

					var child = childs[i];

					var c_duration = child.getDuration();
					var c_progress = child.track('progress');

					d += c_duration;
					t += c_duration * c_progress * 0.01

				}


				var result = parseInt((t*100) / d);

				manager.set(track.id,'progress',result);

			}

		},


		'onchange': function(track, manager){

			//get reffering node
			var node = manager.document.getNodeById(track.id);

			var parent = node.getParent();

			if(parent) manager.refresh(parent.id, 'progress');

			return;

		},

		'onupdate': function(track, manager, playheadEvent){

			if(!track) return;

			var p = parseFloat((playheadEvent.time*100)/(playheadEvent.duration*1000));

			manager.set(track.id, this.name, p);

			return;

		}

	};


	////////////////////////////////
	// STATUS PROPERTY
	////////////////////////////////

	var STATUS = {};
	STATUS.NOTATTEMPTED    	= 0;    	
	STATUS.INCOMPLETE      	= 1;    	// views>0
	STATUS.COMPLETED      	= 2;    	// played & completed
	STATUS.FAILED          	= 3;    	// completed & score<minScore
	STATUS.PASSED          	= 4;    	// completed & score>=minSCore
	STATUS.BONUS          	= 5;    	// bonus :D

	AttributeHandlers.status = {

		'name':'status',

		'defaults':STATUS.NOTATTEMPTED,

		'get':function(track, manager, format){

			var node = manager.document.getNodeById(track.id);
			value_raw = node[0].getAttribute('track-'+this.name);

			var value = parseInt(track.get('status'));

			if (_.isUndefined(value_raw) || _.isNull(value_raw) || _.isNaN(value_raw) || value_raw == 'none')
				if(format!='raw') value = this.defaults;


			switch(format){
				case 'raw':		
					value = value_raw;
				break;
				case 'text':
					var keys = _.keys(STATUS);
					var values = _.values(STATUS);

					var index = values.indexOf(value);
					if(index>=0){
						var name = (keys[index]).toLowerCase();
						value = name;						
					}
				break;
				case 'code':
					var keys = _.keys(STATUS);
					var values = _.values(STATUS);

					var index = values.indexOf(value);
					if(index>=0){
						var name = (keys[index]).toLowerCase();
						value = name[0].toUpperCase();						
					}
				break;
				case 'value':
				default:
				break;
			}

			return value;

		},


		'set':function(value, track, manager) {
			
			//filter input value
			//various input value formats are accepted

			var val = value;

			//numeric value
			if(_.isNumber(parseInt(val)) && !_.isNaN(parseInt(val))){

				//ensure is integer
				val = parseInt(value);

				//ensure val is between valid range
				val = Math.max(val,0);
				val = Math.min(val,_.size(STATUS)-1);

			}
			else if(_.isString(val) && val!=''){

				//set input to uppercase
				val = val.toUpperCase();

				//check if val exists as charcode
				var codes = _.keys(STATUS);
				for (var i=0; i< codes.length;i++){
					if (codes[i].indexOf(val) == 0){
						val = STATUS[codes[i]];
						break;
					}
				}

				//if was found val should be a number
				//else exit due to invalid input
				if(!_.isNumber(val)) return;

			}
			else{

				//invalid input
				//not number neither string
				return;
			}



			//get current value
			var cval = parseInt(track.get('status'));
			cval = (!_.isFinite(cval))? this.defaults : cval;

			//will only be considered as a change when increasing 
			var is_change = (val>cval)? true : false;


			if(is_change){
				
				switch(val){

					case STATUS.NOTATTEMPTED:


					break;

					case STATUS.INCOMPLETE:

						//autocomplete?
						var autocomplete = track.get('autocomplete');
						if(autocomplete && autocomplete=='true') val = STATUS.COMPLETED;
						else{

							//tracks refering node with duration == 0
							//automatically become 'completed'

							//get reffering node
							var node = manager.document.getNodeById(track.id);

							//get duration
							var duration = node.getDuration();

							if(duration == 0) val = STATUS.COMPLETED;

						}

						if (val == STATUS.COMPLETED){

							//check for 'autopass'
							var autopass = track.get('autopass');
							var score = parseScoreString(track);

							if(autopass && autopass=='true') val = STATUS.PASSED;
							else if (!score || score=='none' || score=='auto') val = STATUS.PASSED;
							else{

								//tracks with score.min == 0
								//automatically become 'passed'

									if(score.min === 0) 				resultant_status = STATUS.PASSED;
									else if(score.value>=score.min) 	resultant_status = STATUS.PASSED;
									else 								resultant_status = STATUS.FAILED;

							}

						}
						
					break;

					case STATUS.COMPLETED:

						/*

							controlled by method? node.track.validate() ? 



							//check for 'autopass'
							var autopass = track.get('autopass');
							var score = parseScoreString(track);

							if(autopass && autopass=='true') val = STATUS.PASSED;
							else if (!score || score=='none' || score=='auto') val = STATUS.PASSED;
							else{

								//tracks with score.min == 0
								//automatically become 'passed'
								
									if(score.min === 0) 				resultant_status = STATUS.PASSED;
									else if(score.value>=score.min) 	resultant_status = STATUS.PASSED;
									else 								resultant_status = STATUS.FAILED;

							}
					
						*/

					break;

					case STATUS.FAILED:

					break;

					case STATUS.PASSED:
					
					break;

					case STATUS.BONUS:


					break;															

				}


				//ensure progress 100 if completed
				if(val>STATUS.INCOMPLETE) track.set({'progress':100},{'silent':true});


				//apply new value silently
				if(is_change) track.set({'status':val},{'silent':true});


				//realease 'change' track event
				track.change();

			}




			//apply especial track cmd related with 'status' value

			//var known_cmds = ['onattempt','oncomplete','onfail','onpass','onbonus'];
		
			if(is_change){



				switch(val){

					case STATUS.NOTATTEMPTED:

					break;


					case STATUS.INCOMPLETE:

						var onattempt = track.get('onattempt');
						if(onattempt) execTrackExpression(track,onattempt, manager);

					break;


					case STATUS.COMPLETED:
					
						if (cval<STATUS.INCOMPLETE){
							var onattempt = track.get('onattempt');
							if(onattempt) execTrackExpression(track,onattempt, manager);
						}

						var oncomplete = track.get('oncomplete');
						if(oncomplete) execTrackExpression(track,oncomplete, manager);

					break;


					case STATUS.FAILED:

						if (cval<STATUS.INCOMPLETE){
							var onattempt = track.get('onattempt');
							if(onattempt) execTrackExpression(track,onattempt, manager);
						}

						if (cval<STATUS.COMPLETED){
							var oncomplete = track.get('oncomplete');
							if(oncomplete) execTrackExpression(track,oncomplete, manager);
						}

						var onfail = track.get('onfail');
						if(onfail) execTrackExpression(track,onfail, manager);

					
					break;


					case STATUS.PASSED:

						if (cval<STATUS.INCOMPLETE){
							var onattempt = track.get('onattempt');
							if(onattempt) execTrackExpression(track,onattempt, manager);
						}

						if (cval<STATUS.COMPLETED){
							var oncomplete = track.get('oncomplete');
							if(oncomplete) execTrackExpression(track,oncomplete, manager);
						}

						var onpass = track.get('onpass');
						if(onpass) execTrackExpression(track,onpass, manager);

					
					break;


					case STATUS.BONUS:

						if (cval<STATUS.INCOMPLETE){
							var onattempt = track.get('onattempt');
							if(onattempt) execTrackExpression(track,onattempt, manager);
						}

						if (cval<STATUS.COMPLETED){
							var oncomplete = track.get('oncomplete');
							if(oncomplete) execTrackCommand(track,oncomplete, manager);
						}

						if (cval<STATUS.PASSED){
							var onpass = track.get('onpass');
							if(onpass) execTrackCommand(track,onpass, manager);
						}

						var onbonus = track.get('onbonus');
						if(onbonus) execTrackCommand(track,onbonus, manager);
					

					break;															

				}


			}



			//return resulting value
			return (is_change)? val : cval;

		},

		onchange: function (track, manager) {

			console.log(track.id + ': '+ track.get('status') +' <- '+ track.changed.status);
			
		}


	};


	////////////////////////////////
	// ACCESS
	////////////////////////////////

	var ACCESS = {};
	ACCESS.ENABLED 	    = 0;    		// its allow to enter
	ACCESS.DISABLED     = 1;    		// enter is disabled
	ACCESS.HIDDEN		= 2;    		// enter is not allowed


	AttributeHandlers.access = {

		'name': 'access',

		'defaults': ACCESS.ENABLED,

		'get':function(track, manager, format){

			var node = manager.document.getNodeById(track.id);
			value_raw = node[0].getAttribute('track-'+this.name);

			var value = parseInt(track.get('access'));

			if (_.isUndefined(value_raw) || _.isNull(value_raw) || _.isNaN(value_raw) || value_raw == 'none')
				if(format!='raw') value = this.defaults;

			switch(format){
				case 'raw':
					value = value_raw;
				break;
				case 'text':
					var keys = _.keys(ACCESS);
					var values = _.values(ACCESS);

					var index = values.indexOf(value);
					if(index>=0){
						var name = (keys[index]).toLowerCase();
						value = name;						
					}
					value = name;

				break;

				case 'code':
					var keys = _.keys(ACCESS);
					var values = _.values(ACCESS);

					var index = values.indexOf(value);
					if(index>=0){
						var name = (keys[index]).toLowerCase();
						value = name[0].toUpperCase();						
					}
				break;

				case 'value':
				default:
				break;
			}

			return value;

		},


		'set':function(value, track, manager) {
			
			//filter input value
			//various input value formats are accepted

			var val = value;

			//numeric value
			if(_.isNumber(parseInt(val)) && !_.isNaN(parseInt(val))){

				//ensure is integer
				val = parseInt(value);

				//ensure val is between valid range
				val = Math.max(val,0);
				val = Math.min(val,_.size(ACCESS)-1);

			}
			else if(_.isString(val) && val!=''){

				//set input to uppercase
				val = val.toUpperCase();

				//check if val exists as charcode
				var codes = _.keys(ACCESS);
				for (var i=0; i< codes.length;i++){
					if (codes[i].indexOf(val) == 0){
						val = ACCESS[codes[i]];
						break;
					}
				}

				//if was found val should be a number
				//else exit due to invalid input
				if(!_.isNumber(val)) return;

			}
			else{

				//invalid input
				//not number neither string
				return;
			}


			//get current value
			var cval = parseInt(track.get('access'));

			//will only be considered as a change when increasing 
			var is_change = (val!=cval)? true : false;

			//set value only if is greater than previous value
			if(is_change) track.set('access',val);

			return val;

		}

	};





	////////////////////////////////
	// VIEWS
	////////////////////////////////

	AttributeHandlers.views = {

		'name':'views',

		'get':function(track, manager, format){
			if (format === 'raw'){
				var node = manager.document.getNodeById(track.id);
				return node[0].getAttribute('track-'+this.name);
			}
			else{
				return track.get(this.name);
			}

		},

		'set':function(value, track, manager){
			
			if(!_.isNumber(parseInt(value))) return;

			var val = parseInt(value);
			var cval = parseInt(track.get('views'));

			//set value only if is greater than previous value
			if(val>cval) track.set('views',val);

			return val;

		},


		'onchange': function(track, manager){

			if(track.get('views') == 1){
				if(track.get('status')<STATUS.INCOMPLETE){
					manager.set(track.id, 'status', STATUS.INCOMPLETE);
				}					
			}

			return;

		},
		'onenter': function(track, manager, playheadEvent){

			var val = track.get('views');
			manager.set(track.id, 'views', val+1);
			return;

		}
	};


	////////////////////////////////
	// SCORE
	////////////////////////////////

	AttributeHandlers.score = {

		'name':'score',

		'get':function(track, manager, format){

			if (format === 'raw'){
				var node = manager.document.getNodeById(track.id);
				return node[0].getAttribute('track-'+this.name);
			}

			var score = parseScoreString(track);

			//no score object?
			if (!score) return;
			else if(score==='none') return;
			else{
			//proceed with score object

				if(score==='auto') this.interpolate(track,manager);

				score = parseScoreString(track);

				switch(format){
					case 'min':
						return score.min;
					break;

					case 'max':
						return score.max;
					break;

					case 'string':
						return score.value+'/'+score.min+'/'+score.max;					
					break;

					case 'value':
					default:
						return score.value;					
					break;

				}

			}

			//never should reach this line
			return;

		},

		'interpolate': function(track, manager){

			//get refering node
			var node = manager.document.getNodeById(track.id);

			//check for interpolated values
			var raw = manager.get(track.id, this.name, 'raw');

			if(raw==='auto'){

				var childs = node.children();
				if(childs.length==0) return;

				var value = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,this.name,'value');
					if (!_.isUndefined(val)) value+=parseFloat(val);
				}

				var min = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,this.name,'min');
					if (!_.isUndefined(val)) min+=parseFloat(val);
				}

				var max = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,this.name,'max');
					if (!_.isUndefined(val)) max+=parseFloat(val);
				}

				//apply interpolated value
				var score_string = value + '/' + min + '/' + max;
				track.set({'score':score_string},{'silent':true});

			}


		},

		'isInterpolated': function (track, manager) {
		
			//check for interpolated values
			var raw = manager.get(track.id, this.name, 'raw');

			if(raw==='auto') return true;
			else 			 return false;			

		},

		'refresh': function(track, manager){

			//get refering node
			var node = manager.document.getNodeById(track.id);

			//check for interpolated values
			var raw = manager.get(track.id, this.name, 'raw');
			var score = parseScoreString(track);

			if(raw==='auto'){

				var childs = node.children();
				if(childs.length==0) return;

				var value = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,'score','value');
					if (!_.isUndefined(val)) value+=parseFloat(val);
				}

				var min = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,'score','min');
					if (!_.isUndefined(val)) min+=parseFloat(val);
				}

				var max = 0;
				for (var i = 0; i< childs.length; i++){
					var val = manager.get(childs[i].id,'score','max');
					if (!_.isUndefined(val)) max+=parseFloat(val);
				}

				//apply changes silentlly
				var score_string = value + '/' + min + '/' + max;
				track.set({'score':score_string});

			}

			return;

		},

		'isAutomatic': function(raw){

			if(_.isUndefined(raw) || _.isNull(raw) || _.isNaN(raw)) return true;
			if(raw ==='auto' || raw ==='none') return true;

			return false;
		},
		'set': function(value, track, manager){
			
			var raw = manager.get(track.id, this.name, 'raw');
			var is_auto = this.isAutomatic(raw);
			if(is_auto) return;

			//ok its manual value..
			var score = parseScoreString(track);

			if(!score || score ==='auto' || score ==='none') return;

			var is_sum = false;

			if(_.isString(value)){
				if(value.indexOf('+')===0){
					is_sum = true;
				}
				else if(value.indexOf('-')===0){
					is_sum = true;
				}
			}

			value = parseFloat(value);

			if(!_.isNumber(value)) return;

			var cval = score.value;

			var result = value;
			if(is_sum) result = cval + value;

			var is_change = (result!=cval)? true : false;

			if(is_change){

				//apply changes silentlly
				var score_string = result + '/' + score.min + '/' + score.max;
				track.set({'score':score_string}, {'silent':true});

			}


			//realease 'change' track event
			track.change();	
			
			/*
			if(is_change){

				if(result >= score.min){

					if(result > score.max){
						manager.set(track.id, 'status', STATUS.BONUS);
					}
					else if(track.get('status')<STATUS.PASSED){
						manager.set(track.id, 'status', STATUS.PASSED);
					}	
						
				}

			}*/

		
			//return resulting value
			return result;

		},

		'onchange': function(track, trackman){

			//get reffering node
			var node = trackman.document.getNodeById(track.id);

			var parent = node.getParent();

			if(parent && parent.isTracking(this.name)) trackman.refresh(parent.id,this.name);

			return;

		}


	};



	return AttributeHandlers;



});