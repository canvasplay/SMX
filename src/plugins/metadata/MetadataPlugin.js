((smx)=>{



var NodeInterface = {
  
  meta: function(key){
    
    try{ return this.document.metadata[this.id][key] }
    catch(e){}
    
  },
  
  interpolate: function(key){
    
    var settings = { interpolate: /\{\{(.+?)\}\}/g };
    try{ return _.template(this.meta(key), this, settings) }
    catch(e){}
    
  }
  
}

var DocumentInterface = {
  
}

var Parser = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  smx.meta.parseXML(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        metadata: data
      });
    }
  });
  
}

var MetadataPlugin = {
  
  selector: ':meta',
  
  register: function(){
    
    //add parser
    smx.parsers.push(Parser);
    
    //extend SMXNode
    Object.assign(smx.Node.prototype, NodeInterface);
    
    //extend SMXDocument
    Object.assign(smx.Document.prototype, DocumentInterface);
    
  }
  
}

MetadataPlugin.register();

})(window.smx)