/**
 * Metadata Module
 * @module Metadata
 * @description Lorem ipsum dolor sit amet consectetuer adipiscing elit aliquet amet
 */

import MetadataParser from './MetadataParser.js';
import DocumentInterface from './DocumentInterface.js';
import NodeInterface from './NodeInterface.js';


var Parser = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  //smx.meta.parseXML(xmlDocument, {
  MetadataParser.parseXML(xmlDocument, {
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

export default MetadataPlugin;