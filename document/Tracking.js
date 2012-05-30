
/**
 * <<Interface>>
 * Tracking Node Interface 
 * Provides basic tracking data
 */


SMX.document.Tracking = new JS.Class({

	
	accuracy : 'index', // 'index' or 'time'
	
	//visited flag
	visited : false,
	
	//completed flag
	completed : false,
	
	//autocomplete behavior: (boolean) if true (setAsVisited==setAsCompleted)
	autocomplete: false,
	
	
	//tracking index
	//last child visited
	//this.index;
	
	//tracking time
	//last time played
	//this.time;
	
	initialize: function(){
		
		this.visited = false;
		this.completed = false;

	},
	
	setAsVisited: function(){
		if (this.autocomplete) this.setAsCompleted();
		else this.visited = true;
		return;
	},
	
	setAsUnvisited: function(){
		this.visited = false;
		this.completed = false;
		return;
	},
	
	isVisited:  function(){
		return this.visited;
	},
	
	setAsCompleted: function(){
		this.visited = true;
		this.completed = true;
		return;
	},
	
	setAsIncompleted: function(){
		if (this.autocomplete) this.visited = false;
		this.completed = false;
		return;
	},
	
	isCompleted:  function(){
		return this.completed;
	},
	
	update: function(){
	
	
	
	}
	

	
});
