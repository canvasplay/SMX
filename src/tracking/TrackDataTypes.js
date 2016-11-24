/**

Track Attributes
@module Track Attributes

*/


(function(smx){

 	var SMXTrackingController = {};


 	var parseScoreString = function (track) {

		var str = track.get('score');

		//invalid input return null
		if(!_.isString(str)) return;

		//auto return an empty object
		if(str==='auto' || str==='none') return str;

		//create default score object
		var obj = { 'value': 0, 'min': 0, 'max': 0	};

		//split input by '/'
		var parts = str.split('/');
		if(parts.length==3){

			// 3 parts defines 'value/min/max'
			var value = parseFloat(parts[0]) || 0;
			var min = parseFloat(parts[1]) || 0;
			var max = parseFloat(parts[2]) || 0;

			obj = { 'value': value, 'min': min, 'max': max	};


		}
		else if(parts.length==2){

			// 2 parts defines '0/min/max'
			var min = parseFloat(parts[0]) || 0;
			var max = parseFloat(parts[1]) || 0;
			
			obj = { 'value': 0, 'min': min, 'max': max	};

		}
		else if(parts.length==1){

			// no parts defines '0/max/max'
			var max = parseFloat(parts[0]) || 0;

			obj = { 'value': 0, 'min': max, 'max': max	};
		}

		return obj;  

 	};



 	/**
 	 *	Track Expresions
 	 *
 	 *	track trigger definition format
 	 *
 	 *	!parent:score:+100
 	 *  #nodeId:access:0
 	 *  #nodeId:access:0,!parent:score:+100
 	 *
 	 */





	var AttributeController = {};



	////////////////////////////////
	// EXAMPLE
	////////////////////////////////

	var ExampleAttributeHandler = {

		'name': 'name',

		'default': 'name',

		'set':function(value, track, manager, important) {},

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

	AttributeController.progress = {

		'name': 'progress',

		'default': 0,

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

		'set': function(value, track, manager, important){

			//numeric value is required
			if(!_.isNumber(parseInt(value))) return;

			//normailze recived value
			var val = parseInt(value);
			val = (val>100)? val=100 : (val<0)? 0 : val;

			//will change?
			var is_change = false;
			if(important) is_change = true;
			else{

				//get current value
				var cval = parseInt(track.get('progress'));

				//determine if represents value change
				is_change = (val>cval)? true : false;

			}		

			//will?
			if(is_change){

				//apply value silently
				if(is_change) track.set({'progress':val},{'silent':true});


				//ATTRIBUTE PROPAGATION

				//propagate -> @status
				//@progress directly modifies @status

				//every @status change will become STATUS.INCOMPLETE as min
				//so use STATUS.INCOMPLETE as default resultant value
				var resultant_status = STATUS.INCOMPLETE;

				//@progress >= 100 -> "complete" track
				if(val >= 100) resultant_status = STATUS.COMPLETED;

				//set resultant @status silently
				track.set({'status':resultant_status},{'silent':true});


			}


			//realease changes trigger 'change' event 
			track.change();

			//return resulting value
			return val;

		},

		'refresh': function(track, manager){

			//refresh only automatic values
			var auto = this.isAuto(track, manager);
			if (!auto) return;

			//ok is automatic value, so lets calculate it
			//get raw value
			var raw = manager.raw(track.id, this.name);

			var value;

			switch(raw){
				
				case 'sum':
				case 'avg':
				case 'auto':
				default:

					//get node for given track
					var node = manager.document.getNodeById(track.id);

					var childs = node.children();

					if (childs && childs.length>0){

						var count = 0, sum = 0, n = childs.length;
						for (var i=0; i< n;i++){

							var child = childs[i];

							if (manager.has(child.id, this.name)){

								var c_value = manager.get(child.id, this.name);

								sum += c_value;

								count++;

							}
							else{

							}

						}

						var result = sum/count;

						manager.set(track.id,'progress',result);

					}
					else{



					}



				break;
			}

		},

		'isAuto': function(track, manager){

			var raw = manager.raw(track.id, this.name);

			var value = parseInt(raw);

			var is_auto = true;

			if (_.isNumber(value) && value !== NaN) is_auto = false;

			return is_auto;

		},


		'onchange': function(track, manager){

			//get reffering node
			var node = manager.document.getNodeById(track.id);

			var parent = node.parent();

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

	AttributeController.status = {

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


		'set':function(value, track, manager, important) {
			
			//filter input value
			//various input value formats are accepted

			var val = value;

			//numeric value?
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

			//if(important) is_change = true;
			//else{


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
							//var node = manager.document.getNodeById(track.id);

							//get duration
							//var duration = node.getDuration();

							//if(duration == 0) val = STATUS.COMPLETED;

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


			//return resulting value
			return (is_change)? val : cval;

		},

		onchange: function (track, manager, previous_value) {

			var val = track.get('status');
			switch(val){

				case STATUS.NOTATTEMPTED:

				break;


				case STATUS.INCOMPLETE:

					var onattempt = track.get('onattempt');
					if(onattempt) runTrackExpression(track,onattempt, manager);

				break;


				case STATUS.COMPLETED:
				
					if (previous_value<STATUS.INCOMPLETE){
						var onattempt = track.get('onattempt');
						if(onattempt) runTrackExpression(track,onattempt, manager);
					}

					var oncomplete = track.get('oncomplete');
					if(oncomplete) runTrackExpression(track,oncomplete, manager);

				break;


				case STATUS.FAILED:

					if (previous_value<STATUS.INCOMPLETE){
						var onattempt = track.get('onattempt');
						if(onattempt) runTrackExpression(track,onattempt, manager);
					}

					if (previous_value<STATUS.COMPLETED){
						var oncomplete = track.get('oncomplete');
						if(oncomplete) runTrackExpression(track,oncomplete, manager);
					}

					var onfail = track.get('onfail');
					if(onfail) runTrackExpression(track,onfail, manager);

				
				break;


				case STATUS.PASSED:

					if (previous_value<STATUS.INCOMPLETE){
						var onattempt = track.get('onattempt');
						if(onattempt) runTrackExpression(track,onattempt, manager);
					}

					if (previous_value<STATUS.COMPLETED){
						var oncomplete = track.get('oncomplete');
						if(oncomplete) runTrackExpression(track,oncomplete, manager);
					}

					var onpass = track.get('onpass');
					if(onpass) runTrackExpression(track,onpass, manager);

				
				break;


				case STATUS.BONUS:

					if (previous_value<STATUS.INCOMPLETE){
						var onattempt = track.get('onattempt');
						if(onattempt) runTrackExpression(track,onattempt, manager);
					}

					if (previous_value<STATUS.COMPLETED){
						var oncomplete = track.get('oncomplete');
						if(oncomplete) execTrackCommand(track,oncomplete, manager);
					}

					if (previous_value<STATUS.PASSED){
						var onpass = track.get('onpass');
						if(onpass) execTrackCommand(track,onpass, manager);
					}

					var onbonus = track.get('onbonus');
					if(onbonus) execTrackCommand(track,onbonus, manager);
				

				break;															

			}


			
		}


	};


	////////////////////////////////
	// ACCESS
	////////////////////////////////

	var ACCESS = {};
	ACCESS.ENABLED 	    = 0;    		// its allow to enter
	ACCESS.DISABLED     = 1;    		// enter is disabled
	ACCESS.HIDDEN		= 2;    		// enter is not allowed


	AttributeController.access = {

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


		'set':function(value, track, manager, important) {
			
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

	AttributeController.views = {

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

		'set':function(value, track, manager, important){
			
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

			var val = parseInt(track.get('views'));
			if(_.isNaN(val)) val = 0;
			manager.set(track.id, 'views', val+1);
			return;

		}
	};


	////////////////////////////////
	// SCORE
	////////////////////////////////

	AttributeController.score = {

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
		'set': function(value, track, manager, important){
			
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

			var parent = node.parent();

			if(parent && parent.isTracking(this.name)) trackman.refresh(parent.id,this.name);

			return;

		}


	};



	//expose
	smx.tracking.TrackDataTypes = AttributeController;


})(window.smx);