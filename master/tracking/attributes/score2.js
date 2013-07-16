
////////////////////////////////
// PROGRESS
////////////////////////////////

(function(smx){


var parseScore = function (str) {

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



var ScoreAttributeController = {

	name: 'score',

	get: function(model, collection, format){

		//model has attribute?
		if(!model.has(this.name)) return;

		//get value
		var val = model.get(this.name);

		//get decomposed value
		var score = parseScore(val);

		if (!score) return;
		else if(score==='none') return;
		else{

			switch(format){
				case 'min':
					return score.min;
				break;

				case 'max':
					return score.max;
				break;

				case 'value':
				default:
					return score.value;					
				break;

				case 'string':
					return score.value+'/'+score.min+'/'+score.max;					
				break;				

			}

		}

		//never should reach this line
		return;

	},

	set: function(value, model, collection, important){

		//cannot set in non defined values
		if (!this.isDefined(model, collection)) return;

		//set is only accepted on non computed values or using important
		if (this.isComputed(model, collection) && !important) return;

		//ok its manual value..
		var score = parseScore(model.get(this.name));

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
			model.set({'score':score_string}, {'silent':true});

		}

		/*
		//ATTRIBUTE PROPAGATION

		//propagate -> @status
		//@progress directly modifies @status

		//every @status change will become STATUS.INCOMPLETE as min
		//so use STATUS.INCOMPLETE as default resultant value
		var resultant_status = STATUS.INCOMPLETE;

		//@progress >= 100 -> "complete" track
		if(val >= 100) resultant_status = STATUS.COMPLETED;

		//set resultant @status silently
		model.set({'status':resultant_status},{'silent':true});
		*/

		//realease changes trigger 'change' event 
		model.change();

		//return resulting value
		return;

	},


	'update': function(model, collection){

		//update only defined computed values
		if ( !this.isComputed(model, collection) ) return;

		//get raw value
		var raw = collection.raw(model.id, this.name);

		//get current value
		var value = collection.get(model.id, this.name);

		//it's computed value...
		//so raw value may match any of below
		switch(raw){
			case 'sum':
			case 'auto':
			default:

				//get node for given model
				var node = collection.document.getNodeById(model.id);

				//get node children
				var childs = node.children();

				var result, r_min = 0, r_max = 0;

				//has childs?
				if (_.isEmpty(childs)){
					result = 0;
				}
				else{

					var count = 0, sum = 0, _name = this.name;

					//local reference for nested closures
					var _this = this;

					_.each(childs,function(item,index,list){

						if (collection.has(item.id, _name)){

							//get child model
							var child_model = collection.collection.get(item.id);

							if (child_model && _this.isDefined(child_model, collection)){

								var val = collection.get(child_model.id, _name);

								sum += val;

								count++;

							}


						}
						else{

						}

					});

					result = sum || 0;
				}


			break;
		}


		//var score_string = result + '/' + score.min + '/' + score.max;

		if (value!==result && (result||result==0))
			this.set(result, model, collection, true);

		return;


	},

	propagate: function(model, collection, recursive){

		//update parent track in collection using document tree hierarchy

		//get ref node in collection document
		var node = collection.document.getNodeById(model.id);

		//if ref node has no parent exit silently
		if(!node.hasParent()) return;

		//get ref node parent
		var parent = node.parent();

		//call collection.update for this attribute on parent model
		collection.update(parent.id, this.name);

		//recursive propagation
		if (recursive) collection.propagate(parent.id,this.name);

		return;

	},

	isDefined: function(model, collection){

		var raw = collection.raw(model.id, this.name);

		return ( _.isEmpty(raw) && raw!=='none' )? false : true;

	},

	isComputed: function(model, collection){

		//not defined values are also not computables
		if (!this.isDefined(model, collection)) return false;

		//get raw value
		var raw = collection.raw(model.id, this.name);

		if(raw==='auto'||raw==='sum')	return true;
		else							return false;

	}


};


//expose
smx.tracking.attributes.score = ScoreAttributeController;

})(window.smx);