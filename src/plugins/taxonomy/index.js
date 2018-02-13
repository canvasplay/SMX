/**
 * Taxonomy Module
 * @module Taxonomy
 * @description Lorem ipsum dolor sit amet consectetuer adipiscing elit aliquet amet
 */

import TaxonomyParser from './TaxonomyParser.js';
import NodeInterface from './NodeInterface.js';


var Parser = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  TaxonomyParser.parseXML(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        taxonomy: data
      });
    }
  });
  
}

var TaxonomyPlugin = {
  
  register: function(){
    
    //add parser
    smx.parsers.push(Parser);
    
    //extend SMXNode
    Object.assign(smx.Node.prototype, NodeInterface);
    
  }
  
}

TaxonomyPlugin.register();

export default TaxonomyPlugin;