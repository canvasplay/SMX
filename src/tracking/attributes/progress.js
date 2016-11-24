
////////////////////////////////
// PROGRESS
////////////////////////////////

(function(smx){


var ProgressAttributeController = {

	name: 'progress',

	defaults: '0',

	get: function(model, collection, format){

		//model has attribute?
		if(!model.has(this.name)) return;

		//get value
		var val = model.get(this.name);

		switch(format){
			case 'raw':
				val = collection.raw(model.id,this.name);
			break;
			case 'text':
				val = parseFloat(val);
				if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);
				val = val+'%';
			break;
			case 'value':
			default:
				val = parseFloat(val);
				if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);
			break;
		}

		return val;

	},

	set: function(value, model, collection, important){

		//cannot set in non defined values
		if (!this.isDefined(model, collection)) return;

		//set is only accepted on non computed values or using important
		if (this.isComputed(model, collection) && !important) return;

		//numeric value is required
		if(!_.isNumber(parseInt(value))) return;

		//normailze recived value
		var val = parseInt(value);
		val = (val>100)? val=100 : (val<0)? 0 : val;

		//apply value silently
		model.set({'progress':val},{'silent':true});

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

		//update only computed values
		if (!this.isComputed(model, collection)) return;

		//get raw value
		var raw = collection.raw(model.id, this.name);

		//get current value
		var value = collection.get(model.id, this.name);

		var result;

		//it's computed value...
		//so raw value must match any of following
		switch(raw){
			case 'sum':
			case 'avg':
			case 'auto':

				//get node for given model
				var node = collection.document.getNodeById(model.id);

				//get node children
				var childs = node.children();

				//has childs?
				if (_.isEmpty(childs)){
					//if no childs 100 will be filled
					result = 100;
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

								/*
								if (_this.isComputed(child_model, collection))
									_this.update(child_model, collection);
								*/
								var val = collection.get(child_model.id, _name);

								sum += val;

								count++;

							}


						}
						else{

						}

					});

					if (count>0) result = sum/count;
					//if no progress computable childs 100 will be filled
					else result = 100;

				}

			break;
			default:
			break;
		}


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

		return ((_.isEmpty(raw) && raw !== 0) || raw === 'none')? false : true;

	},

	isComputed: function(model, collection){

		//not defined values are also not computables
		if (!this.isDefined(model, collection)) return false;

		//get raw value
		var raw = collection.raw(model.id, this.name);

		if (raw==='auto') return true;

		var value = parseInt(raw);

		var is_auto = true;

		if (_.isNumber(value) && value !== NaN) is_auto = false;

		return is_auto;

	},



	//exports current valuein base 100 and convert it to base 1

	exports: function(model, collection){

		//model has attribute?
		if(!model.has(this.name)) return;

		//get value
		var val = model.get(this.name);

		val = parseFloat(val);
		if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);


		if(val>0) val = val/100;

		return val;

	},



	//imports value from base 1 and convert it to base 100

	imports: function(value, model, collection, important){

		//cannot set in non defined values
		if (!this.isDefined(model, collection)) return;

		//set is only accepted on non computed values or using important
		if (this.isComputed(model, collection) && !important) return;

		var val = parseFloat(value);

		//numeric value is required
		if(!_.isNumber(val)) return;

		val = val *100;

		//normailze recived value
		val = (val>100)? val=100 : (val<0)? 0 : val;

		//apply value silently
		model.set({'progress':val},{'silent':true});

		//realease changes trigger 'change' event
		model.trigger('change', model);

		//return resulting value
		return;

	}

};


//expose
smx.tracking.attributes.progress = ProgressAttributeController;

})(window.smx);
