
/**
 * <<Interface>>
 * Tracking Node Interface 
 * Provides basic tracking data
 */


SMX.document.NodeTracking = new JS.Class({

	
	//TIME TRACKING
	
	//number of times visualized
	views: 0,
	
	//sum all views time
	time: 0,


	//PROGRESS TRACKING
	
	//percent visualized
	progress: -1,

		//min progress value allowed and min to consider as visited
		minProgress: 0,
		
		//max progress value allowed and min to consider as completed
		maxProgress: 100,

		//autocomplete behavior: (boolean) if true (isCompleted -> isVisited)
		autocomplete: false,
	

	//SCORE TRACKING

	//score points
	score: 0,
	
		//min score points allowed
		minScore: 0,
		
		//max score points allowed
		maxScore: 100,
		
		//min score points to consider as passed
		passScore: 50,
	
	
	
	
	
	initialize: function(){

		
		this.views= 0;
		
		this.time= 0;
		
		this.progress= -1;

		this.minProgress= 0;
		
		this.maxProgress= 100;

		this.autocomplete= false;

		this.score= 0;
		
		this.minScore= 50;
		
		this.maxScore= 100;
		
		this.pasScore= 100;

		this.maxScore= 100;
		
		this.pasScore= 100;

	},
	
	
	getProgress:function(){
		return this.progress;
	},
	
	getScore:function(){
		return this.score;
	},
	
	getTime:function(){
		return this.time;
	},
	
	getViews:function(){
		return this.views;
	},
	
	
	// boolean flag util methods
	
	isVisited:  function(){
		return this.progress >= this.minProgress;
	},
	
	isCompleted:  function(){
		if (this.autocomplete) return this.isVisited();
		else this.progress >= this.maxProgress;
	},
	
	isPassed:  function(){
		return this.score >= this.minScore;
	},
	
	isFailed:  function(){
		return this.score < this.minScore;
	},
	
	
	/**
	 * update: the only one public setter
	 *
	 * examples:
	 * update('progress','38');
	 * update('progress','+2');
	 * update('score','+15');
	 * update('views','+1');
	 *
	 */
	
	update: function(type, value){

		if (!type || !value) return;
		
		//check for valid types
		if( type!='progress' && type!='score' && type!='views' && type!='time') return;
		
		//float abs of value
		var _val = Math.abs(parseFloat(value));
		
		//is 'set' or 'add' operation? default is 'set' operation
		var _add = false;
		
		//positive or negative add, default positive, only used when _add == true
		var _sign = 1;
		
		
		//determines if is 'set' or 'add' operation
		if((value+'')[0] == '+'){
			_add = true;
			_sign = 1;
		}
		else if((value+'')[0] == '-'){
			_add = true;
			_sign = -1;
		}
		
		//apply operation to given type value
		if (_add==true) this[type+''] += _val * _sign;
		else this[type+''] = _val * _sign;

		switch(type){
			case 'progress':
			break;
			case 'score':
				if (_add==true) this.score += _val * _sign;
				else this.score = _val * _sign;
			break;
			case 'time':
				if (_add==true) this.time += _val * _sign;
				else this.time = _val * _sign;
			break;
			case 'views':
				if (_add==true) this.views += _val * _sign;
				else this.views = _val * _sign;
			break;
			default:
				//console.log('invalid update value type:'+ type);
			break;
		
		}
	
	
	}
	

	
});
