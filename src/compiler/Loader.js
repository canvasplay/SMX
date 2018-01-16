(function(global,_,$,smx,log){


	//private aux debug system
	const DEBUG = true;
	const LOG = function(o){if(DEBUG)log('> '+o)};

/**
 * SMX Loader Class
 */
class Loader {
  
  /**
   * creates a new Loader
   */
  constructor(){
    
    this.xhr = null;

  }
  /**
   * load resource by given url
   * @param {String}
   */
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

smx.Loader = Loader;

})(window,_,$,smx,log);