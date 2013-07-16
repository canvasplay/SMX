/**
*	SMX Synchronized Multimedia XML
*
*	@module smx
*
*/



(function(window){


	var smx = {};

	/* software version: major.minor.path */
	smx.version = '0.7.6';


	/* GLOBAL STATUS CODES */
	smx.STATUS_CODE = {};
	smx.STATUS_CODE.UNDEFINED	= -1;
	smx.STATUS_CODE.NOTSTARTED	= 0;
	smx.STATUS_CODE.ERROR		= 1;
	smx.STATUS_CODE.LOADED		= 2;
	smx.STATUS_CODE.BUSY		= 3;
	smx.STATUS_CODE.READY		= 4;


	//expose

	window.smx = smx;


})(window);


	