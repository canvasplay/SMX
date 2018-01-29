(function(global,_,$,smx,LOG){


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
    
    this.xhr;
    if(global.ActiveXObject)
      this.xhr = new global.ActiveXObject("MSXML2.XMLHTTP.3.0")
    else
      this.xhr = new global.XMLHttpRequest();
      
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
    var ext = xhr.responseURL.split('.').pop();
    console.log(ext);
  }

  onError(xhr){
    LOG( xhr.responseURL+'" '+xhr.status +' ('+ xhr.statusText+')');
    LOG( xhr.responseText);
  }

  
}

smx.Loader = Loader;

})(window,_,$,smx,log);