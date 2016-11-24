

/* SMX NODE CONTROLLER */

(function(smx) {

	var NodeController = function(document, node, binds){
	
		if(!document || !node)

		this.document = document;

		this.node = node;
	
		this.binds = options.binds;

		return this;
		
	};

	NodeController.prototype.load = function(){
	
		for (var i=0; i< this.binds.length;i++){

			var bind = this.binds[i];

			try{
				bind.object.on(bind.eventName,_.bind(bind.callback,this));				
			}
			catch(e){}

		}
	
	};

	NodeController.prototype.unload = function(){
	
		for (var i=0; i< this.binds.length;i++){

			var bind = this.binds[i];

			try{
				bind.object.off(bind.eventName,_.bind(bind.callback,this));				
			}
			catch(e){}

		}
	
	};

	//expose
	smx.NodeController = NodeController;


})(window.smx);