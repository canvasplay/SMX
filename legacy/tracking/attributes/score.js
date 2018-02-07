
////////////////////////////////
// SCORE
////////////////////////////////

(function(smx){


var SCORE = function(str){

	//invalid input return null
	if(!_.isString(str)) return;

	//auto return an empty object
	if(str==='auto' || str==='none') return str;

	//split input by '/'
	var parts = str.split('/');

	//convert parts into floats
	for(var i=0; i< parts.length;i++) parts[i] = parseFloat(parts[i]);

	var score = {
		'value': 	parts[0] || 0,
		'min': 		parts[1] || 0,
		'max': 		parts[2] ||-1,
		'factor': 	parts[3] || 1
	};

	return score;
};



var ScoreAttributeController = {

	name: 'score',

	get: function(model, collection, format){

		//model has attribute?
		if(!model.has(this.name)) return;

		//get value
		var val = model.get(this.name);

		//get decomposed value
		var score = SCORE(val+'');

		if (!score) return;
		else if(score==='none') return;
		else{

			switch(format){

				case 'value':
				default:
					return score.value;
				break;

				case 'min':
					return score.min;
				break;

				case 'max':
					return score.max;
				break;


				case 'factor':
					return score.factor;
				break;

				case 'object':
					return score;
				break;

				case 'text':
				case 'string':
					return val;
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
		var score = SCORE(model.get(this.name)+'');

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
			var score_string = result + '/' + score.min + '/' + score.max+ '/' + score.factor;
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
		model.trigger('change', model);

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

		var result, r_min = 0, r_max = 0;

		var f = collection.get(model.id, this.name, 'factor');

		//it's computed value...
		//so raw value may match any of below
		switch(raw){
			case 'sum':
			case 'auto':
			default:

				//get node for given model
				var node = collection.document.getNodeById(model.id);

				//get node children
				var childs = node.children;

				//has childs?
				if (_.isEmpty(childs)){
					result = 0;
				}
				else{

					var sum = 0, _name = this.name;

					//local reference for nested closures
					var _this = this;

					_.each(childs,function(item,index,list){

						if (collection.has(item.id, _name)){

							//get child model
							var child_model = collection.collection.get(item.id);

							if (child_model && _this.isPropagable(child_model, collection)){

								var val = collection.get(child_model.id, _name);
								var min = collection.get(child_model.id, _name,'min');
								var max = collection.get(child_model.id, _name,'max');
								var factor = collection.get(child_model.id, _name,'factor');

								if(_.isUndefined(factor) || factor > 0 ){

									sum += val;

									r_min += min;
									if(max!=-1) r_max += max;

								}



							}


						}
						else{

						}

					});

					result = sum || 0;
				}


			break;
		}


		var score_string = result + '/' + r_min + '/' + r_max + '/'+ f;

		model.set(this.name, score_string);

		return;


	},

	propagate: function(model, collection, recursive){

		//update parent track in collection using document tree hierarchy

		//get ref node in collection document
		var node = collection.document.getNodeById(model.id);

		//if ref node has no parent exit silently
		if(!node.parent) return;

		//get ref node parent
		var parent = node.parent;

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

		//not defined values are also non computed
		if (!this.isDefined(model, collection)) return false;

		//get raw value
		var raw = collection.raw(model.id, this.name);

		if(raw==='auto'||raw==='sum')	return true;
		else							return false;

	},

	isPropagable: function(model, collection){

		//not defined values are also non propagables
		if (!this.isDefined(model, collection)) return false;

		var factor = this.get(model,collection,'factor');

		return (factor==-1)? false : true;

	},



	exports: function(model, collection){


		return;
	},


	imports: function(value, model, collection, important){


		return;
	}



};


//expose
smx.tracking.attributes.score = ScoreAttributeController;

})(window.smx);
