/**
* Timer Controller
*
* @class Timer
* @constructor
*/

(function(){


	var SMXTimer = function(){

		_.extend(this, Backbone.Events);

		//interval time
		this.fps = 16; // [ 16 | 24 | 32 | 48 | 64 ... ] higher value may push performance limits (not recommended)
		
		//timer engine
		this.engine = null;
		
		//external engine
		this.extEngines = [];
		
		//time counter
		this.time = 0;
		
		//time flag
		this.time_flag = null;
		
		//loop enabled or not
		this.paused = true;

		//requestAnimationFrame?
		this.rAF = false;

		//speed
		this.factor = 1;

		this.start = function(){
		
			//prevents duplicated runs
			if (this.engine) this.stop();
			
			//set time_flag
			this.time_flag = new Date().getTime();
			
			//activate loop
			this.paused = false;
			
			//set timeout
			if (this.rAF) this.engine = window.requestAnimationFrame( _.bind(this.update,this) );
			else this.engine = setTimeout( _.bind(this.update,this), 1000/this.fps );

		};
		
		
		this.plugExtEngine = function(engineId, engine_callback){
		
			//engine_callback must be a function returning current time in ms
			this.extEngines.unshift({'id': engineId, 'callback': engine_callback});

			return;
		
		};
		
		this.unplugExtEngine = function(engineId){
		
			var found_at_index = -1;
			for (var i=0; i< this.extEngines.length; i++){
				if(this.extEngines[i].id==engineId){
					this.extEngines[i] = null;
					found_at_index = i;
				}
			}
			if(found_at_index>=0){
				this.extEngines.splice(found_at_index,1);
			}

			if (this.extEngines.length==0 && !this.paused) this.start();
			
			return;
		
		};
		
		this.update = function(time,timerId){
		
			//using internal engine 'update' recives 0 parameters
			//and use new Date().getTime() to calculate time ellapsed since last update

			//external engines callback must recive 2 param
			//time: target time
			//timerId: id of a registered external engine
			//only registered engines via 'plugExtEngine' method take effect
			//if timerId is not found time param will be ignored and will exit silently

			if (typeof time != 'undefined' && typeof timerId != 'undefined'){

				//multiple external engines are not supported
				//so, always take only the first extEngine and ignore the others
				if (this.extEngines[0].id == timerId){

					//update using param provided by external engine
					this.time = time;
					//debug.log('TIMER - timer:'+ parseInt(this.time) +' from externalEngine:'+this.extEngines[0].id);
				
					//notify update and exit
					this.trigger('update');
					return;

				}
				else{

					//timerId not found, exit silently
					return;
				}

			}

			//calculate time ellapsed since last update
			var time_now = new Date().getTime();
			var time_offset = (this.time_flag!=null)? time_now - this.time_flag : 0;
			this.time_flag = time_now;


			//calculate real fps
			//var fps = 1000/time_offset;

			//update time
			this.time+=time_offset*this.factor;	
			//debug.log('TIMER - timer:'+ parseInt(this.time) +' from internal engine');


			//set timeout to next frame
			if (!this.paused && this.extEngines.length==0){
				if (this.rAF) this.engine = window.requestAnimationFrame( _.bind(this.update,this) );
				else this.engine = setTimeout( _.bind(this.update,this), 1000/this.fps );
			}

			//notify update and exit
			this.trigger('update');

			return;

		};
		
		
		this.setTime = function(t){
		
			this.time = t;
			
			//notify update
			this.trigger('update');


		};

		this.stop = function(){
		
			//reset timeout
			if (this.engine){
				if (this.rAF) window.cancelAnimationFrame(this.engine);
				else clearTimeout(this.engine);
				this.engine = null;
			}
			
			//reset time_flag
			this.time_flag = null;
			
			//deactivate update loop
			this.paused = true;
			
			return;

		};
		
		this.reset = function(){
		
			this.stop();
			this.time = 0;

		};
		
		this.destroy = function(){

			//kill loop process
			this.stop();

			//clear extEngines
			this.extEngines = [];

			return;
		};
		

		return this;
		
	};

	//expose 

	window.smx.time.Timer = SMXTimer;

})(window.smx);