
(function(smx) {


	var Track = Backbone.Model.extend({

		 defaults: {},

		initialize: function(){
		
			return this;

		}
		
	});

	//return Track;
	//expose

	smx.tracking.Track = Track;


})(window.smx);
