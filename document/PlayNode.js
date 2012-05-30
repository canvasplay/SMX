/**
 * SMX PlayNode Class
 * Provides basic methods for navigational interactions
 */

SMX.document.PlayNode = new JS.Class(SMX.document.Node,{

	include: Ojay.Observable,

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'PLAYNODE';

		this.startMode = 'STAY';

		this.finishMode = 'NEXT';
		
		this.meta = new SMX.document.Metadata();
		
		this.tracking = new SMX.document.Tracking();

		this.time = 0;
		
		//this.index = 0;
		
		this.path = '';
		
		this.tags = [];
		
		this.template = null;
		
		this.style = null;
		
	},
	
	getPath : function(){
	
		var url = this.path;
		
		var p = this.getParentNode();
		while(p){
			url = p.path + url;
			p = p.getParentNode();
		}
		
		return url;
		
	},

	//get duration of this node based on getDuration of child nodes
	//@return: Number
	getDuration : function(){
	
		if (this.duration) return this.duration;
		else{
			var sum_time = 0;
			var _childnodes = this.getChildNodes();
			for (var n =0; n<_childnodes.length;n++){
				var _node = _childnodes[n];
				var _node_duration = _node.getDuration();
				sum_time += parseInt(_node_duration);
				//console.log(sum_time);
			}
			//console.log('--> '+sum_time);
			return sum_time;
		}
		
	},

	//eliminate <scene> type? maybe could exist only one generic block?? more abstract!!
	//<block timeline="true|false">...</block>
	//this.timeline = null;

	/**
	 * Method: enterNode
	 * @desc: 
	 *
	 */
	enter : function(options){
		
		//fire 'beforeEnter' event
		this.trigger('beforeEnter');

		//setup node
		//...

		//track as visited
		if (this.tracking.setAsVisited()) this.trigger('tracking');
		
		//fire 'enter' event
		this.trigger('enter');

		//start node
		//this.startNode();
		
	},

	start : function(options){
		
		//fire 'beforeStart' event
		this.trigger('beforeStart');

		//...
		
		//fire 'start' event
		this.trigger('start');
		
	},
	
	
	finish : function(options){
	

		//fire 'beforeFinish' event
		this.trigger('beforeFinish');

		//...
		

		//modify finish behavior
		//switch(this.finishMode){}
		
		//track as complete
		if (this.tracking.setAsCompleted()) this.trigger('tracking');
		
		//propagate tracking, bubble up in tree node
		if (this.hasParentNode()){
			var is_parent_complete = true;
			var parent = this.getParentNode();
			if (parent.hasChildNodes()){
				var childs = parent.getChildNodes();
				for (var i =0; i< childs.length; i++){
					if (!childs[i].tracking.isCompleted()) is_parent_complete = false;
				}
			}
			if (is_parent_complete) parent.tracking.setAsCompleted()
		}
		
		//fire 'finish' event
		this.trigger('finish');

		
	},
	
	exit : function(options){
	
		
		//fire 'beforeExit' event
		this.trigger('beforeExit');

		//...
		
		//fire 'exit' event
		this.trigger('exit');
		
	},

	reset : function(){
	
		//fire 'exit' event
		this.trigger('reset');

	},

	play : function(){
	
		//fire 'play' event
		this.trigger('play');
		
	},
	
	pause : function(){
	
		//fire 'pause' event
		this.trigger('pause');
		
	},
	
	toggle : function(){
	
		//fire 'exit' event
		//this.trigger('toggle');
		
	},
	
	
	
});