/**
 * SMX DOCUMENT COMPILER
 * Load smx xml document, search and load recursively "include" nodes,...
 */

(function(global,_,$,smx,log){


	//private aux debug system
	const DEBUG = true;
	const LOG = function(o){if(DEBUG)log('> '+o)};


class SMXLoader {
  
  constructor(){
    
    this.xhr = null;

  }
  
  load(url){

    var onSuccess = _.bind(this.onSuccess, this);
    var onError = _.bind(this.onError, this);
    
    this.xhr = (global.ActiveXObject)? new global.ActiveXObject("MSXML2.XMLHTTP.3.0") : new global.XMLHttpRequest();
    this.xhr.open('GET', url);
    this.xhr.onload = function(evt) {
        if (evt.target.status === 200)
          onSuccess(evt.target);
        else
          onError(evt.target);
    };
    this.xhr.send();

    return
	 		
  }
  
  onSuccess(xhr){
    LOG( xhr.responseURL+' '+xhr.status +' ('+ xhr.statusText+')');
    LOG( xhr.responseText);
  }

  onError(xhr){
    LOG( xhr.responseURL+'" '+xhr.status +' ('+ xhr.statusText+')');
    LOG( xhr.responseText);
  }

  
}


smx.Loader = SMXLoader;

})(window,_,$,smx,log);