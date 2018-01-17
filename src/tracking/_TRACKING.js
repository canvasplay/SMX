(function(win, smx){

var SMX = {};
SMX.TRACKING = {};

SMX.TRACKING.STATUS = {

	'NOTATTEMPTED'    	: 0,    	// never attempted
	'INCOMPLETE'      	: 1,    	// attempted but not completed, in progress..
	'COMPLETED'      		: 2,    	// played & completed
	'FAILED'          	: 3,    	// completed & score<minScore
	'PASSED'          	: 4,    	// completed & score>minScore
	'PERFECT'          	: 5,    	// completed & score==maxScore -> perfect
	'BONUS'          		: 6				// bonus :D

};


SMX.TRACKING.ACCESS = {

	'ENABLED'			    	: 0,    	// default as enabled
	'DISABLED'	      	: 1,    	// is not accesible
	'HIDDEN'	      		: 2    		// not accesible and not visible
};

win.SMX = SMX;


})(window, window.smx);
