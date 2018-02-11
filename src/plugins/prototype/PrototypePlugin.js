((smx)=>{



var NodeInterface = {

}

var DocumentInterface = {
  
}

var Parser = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  smx.proto.parseXML(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        proto: data
      });
    }
  });
  
}

var PrototypePlugin = {
  
  selector: ':proto',
  
  register: function(){
    
    //add parser
    smx.parsers.push(Parser);
    
    //extend SMXNode
    Object.assign(smx.Node.prototype, NodeInterface);
    
    //extend SMXDocument
    Object.assign(smx.Document.prototype, DocumentInterface);
    
  }
  
}

PrototypePlugin.register();

})(window.smx)