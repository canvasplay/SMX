
/*


	I WANNA TRIGGER LIKE THIS

	track-trigger-change-score: tracking.propagate(this, score);

	track-trigger-once-views: 1 ? tracking.set(next, access, 0);
	track-trigger-once-status: complete ? playhead.outside;


*/


/**

Track Attributes
@module Track Attributes

*/


(function(global){

	//smx is required
	if(!global.smx) throw('SMX ERROR (101) smx is not defined!');

	//define local smx reference
	var smx = global.smx;





	var parseAttrKey = function(attr_key){

		//string type is required
		if(!_.isString(attr_key)) return;

		//is valid key? valid TrackTrigger key starts with "track-trigger-"
		if(attr_key.indexOf('track-trigger-')!==0) return;

		var parts = attr_key.split('-');

		//3rd part is required
		if(_.isEmpty(parts[2])) return;

		//parts[2] may define "when" may be checked the trigger's firing condition
		// once | change | enter | exit

		//parts[3] may define which track attribute observes (optional)
		// status | score | progress | ...

		return { 'hook': parts[2], 'key': parts[3] };

	}

	var parseExpression = function(exp){

		// 1 ? tracking.set(next, access, 0);
		// complete ? playhead.outside;

		//string type is required
		if(!_.isString(exp)) return;

		var parts = exp.split('?');

		//3rd part is required
		if(_.isEmpty(parts[2])) return;

		//parts[2] may define "when" may be checked the trigger's firing condition
		// 'once' | 'change' | 'enter' | 'exit'

		//parts[3] may define which track attribute observes

		return { 'hook': parts[2], 'key': parts[3] };

	}


 	var runTriggerExpression = function (attr, exp, manager ) {

 		var result = [];

		if(!_.isString(exp)) return;

   		var exps = [];

		if(exp.indexOf(','))  exps = exp.split(',');
 		else 					exps.push(exp);

 		for(var i=0; i< exps.length;i++){

			var cmd_parts = exps[i].split(':');

			//cmd requires 3 parts
			if(cmd_parts.length==3){

				var trackId = cmd_parts[0];
				var property = cmd_parts[1];
				var value = cmd_parts[2];

				//get track
				if(trackId.indexOf('!') === 0){

					var ins = trackId.substr(1);

					var node = manager.document.getNodeById(track.id);

					if(!node) ins = 'null';

					switch(ins){

						case 'null':
							node = null;
						break;

						case 'next':
							node = node.next();
						break;
						case 'previous':
							node = node.previous();
						break;
						case 'parent':
							node = node.parent();
						break;
						case 'childs':
							node = node.children();
						break;
						case 'firstchild':
							node = node.first();
						break;
						case 'allnext':
							res = [];
							var next = node.next();
							while(next){
								res.push(next);
								next = next.next();
							}
							if (res.length>0) 	node = res;
							else				node = null;
						break;
						case 'allprevious':
							res = [];
							var prev = node.previous();
							while(prev){
								res.push(prev);
								prev = prev.previous();
							}
							if (res.length>0) 	node = res;
							else				node = null;
						break;
					}

					if(node){
						if(_.isArray(node))		trackId = _.pluck(node,'id');
						else					trackId = node.id;
					}

				}
				else if(trackId.indexOf('#') === 0){
					trackId = trackId.substr(1);
				}
				else{
					trackId = trackId;					
				}

				var command = {
					'id': trackId,
					'property': property,
					'value': value
				};

				result.push(command);		

			}
			else if(cmd_parts[0].indexOf('@') === 0){

				var ins = cmd_parts[0].substr(1);
				var playhead = manager.document.playhead;
				if (_.isFunction(playhead[ins])){
					playhead[ins]();
				}	

			}

 		}



		var commands = result;

		for(var i=0; i< commands.length;i++){
			var cmd = commands[i];
			manager.set(cmd.id, cmd.property, cmd.value);
		}


 		return;

 	};


 	//expose to global
 	//global.smx.TriggerExpression = TriggerExpression;



})(window);