
////////////////////////////////
// SCORE
////////////////////////////////

(function(smx){



var PointsAttributeController = {

	name: 'points',

	get: function(model, collection, format){

		//model has attribute?
		if(!model.has(this.name)) return;

		//get value
		var val = model.get(this.name);

		//get decomposed value
		var points = parseInt(val) || 0;

		if(points==='none') return;
		else{

			switch(format){


				case 'text':
				case 'string':
					return points+'';
				break;

				case 'value':
				default:
					return points;
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
		var points = model.get(this.name);

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

		var cval = parseInt(points);

		var result = value;
		if(is_sum) result = cval + value;

		var is_change = (result!=cval)? true : false;

		if(is_change){

			//apply changes silentlly
			model.set({'points':result}, {'silent':true});

		}

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

		var result;

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

								sum += val;


							}


						}
						else{

						}

					});

					result = sum || 0;
				}


			break;
		}

		model.set(this.name, result);

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

	}


};


//expose
smx.tracking.attributes.points = PointsAttributeController;

})(window.smx);
