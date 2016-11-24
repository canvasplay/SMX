
////////////////////////////////
// STATUS
////////////////////////////////

(function(smx){



var STATUS = {};
STATUS.NOTATTEMPTED    	= 0;    	
STATUS.INCOMPLETE      	= 1;    	// views>0
STATUS.COMPLETED      	= 2;    	// played & completed
STATUS.FAILED          	= 3;    	// completed & score<minScore
STATUS.PASSED          	= 4;    	// completed & score>minScore
STATUS.BONUS          	= 5;    	// completed & score==maxScore -> perfect
STATUS.EXTRA          	= 6;    	// bonus :D


var StatusAttributeController = {

	name: 'status',

	defaults: STATUS.NOTATTEMPTED,

	get: function(model, collection, format){

		//cant get in non defined values
		if (!this.isDefined(model, collection)) return;

		//get current value
		var value = model.get(this.name);

		//which format?
		switch(format){
			case 'text':

				var keys = _.keys(STATUS);
				var values = _.values(STATUS);

				var index = values.indexOf(value);
				if(keys[index])
					value = (keys[index]).toLowerCase();	

			break;
			case 'code':

				var keys = _.keys(STATUS);
				var values = _.values(STATUS);

				var index = values.indexOf(value);
				if(keys[index])
					value = keys[index].toUpperCase()[0];						

			break;
			case 'value':
			default:
			break;
		}

		//return resultant value
		return value;

	},

	set: function(value, model, collection, important){

		//cant set in non defined values
		if (!this.isDefined(model, collection)) return;

		//set is only accepted on non computed values or using important
		if (this.isComputed(model, collection) && !important) return;


		//filter input value
		//various input value formats are accepted

		//numeric value?
		if(_.isNumber(parseInt(value)) && !_.isNaN(parseInt(value))){

			//ensure is integer
			value = parseInt(value);

			//ensure val is between valid range
			value = Math.max(value,0);
			value = Math.min(value,_.size(STATUS)-1);

		}
		else if(_.isString(value) && value!=''){

			//set input to uppercase
			value = value.toUpperCase();

			//check if val exists as charcode
			var codes = _.keys(STATUS);
			for (var i=0; i< codes.length;i++){
				if (codes[i].indexOf(value) == 0){
					value = STATUS[codes[i]];
					break;
				}
			}

			//if was found val should be a number
			//else exit due to invalid input
			if(!_.isNumber(value)) return;

		}
		else{

			//invalid input
			//not number neither string
			return;
		}




		//apply value silently
		model.set({'progress':val},{'silent':true});


		//realease changes trigger 'change' event 
		model.change();

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
		//so raw value may match any of below
		switch(raw){
			case 'sum':
			case 'avg':
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

					if (count>0) result = sum/count;
					else result = 0;

				}

			break;
		}


		if (value!==result && (result||result==0))
			this.set(result, model, collection, true);

		return;


	},

	propagate: function(model, collection){

		//update parent track in collection using document tree hierarchy

		//get ref node in collection document
		var node = collection.document.getNodeById(model.id);

		//if ref node has no parent exit silently
		if(!node.hasParent()) return;

		//get ref node parent
		var parent = ref_node.parent();

		//call collection.update for this attribute on parent model
		collection.update(parent.id, this.name);

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

	}


};


//expose
smx.tracking.attributes.progress = ProgressAttributeController;

})(window.smx);