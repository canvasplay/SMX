
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

				if(keys[value])
					value = (keys[value]).toLowerCase();

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
		model.set({ 'status' : value},{'silent':true});


		//realease changes trigger 'change' event
		model.trigger('change', model);

		//return resulting value
		return value;

	},


	'update': function(model, collection){ return },

	propagate: function(model, collection){ return },


	isDefined: function(model, collection){

		var raw = collection.raw(model.id, this.name);

		return ((_.isEmpty(raw) && raw !== 0) || raw === 'none')? false : true;

	},

	isComputed: function(model, collection){

		return false;

	}


};


//expose
smx.tracking.attributes.status = StatusAttributeController;

})(window.smx);
