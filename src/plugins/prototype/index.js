/**
 * Prototype Module
 * @module Prototype
 * @description Lorem ipsum dolor sit amet consectetuer adipiscing elit aliquet amet
 */

import PrototypeParser from './PrototypeParser.js';

var Parser = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  PrototypeParser.parseXML(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        proto: data
      });
    }
  });
  
};

var PrototypePlugin = {
  
  register: function(smx){
    
    //add parser
    smx.parsers.push(Parser);
    
  }
  
};

//PrototypePlugin.register();

export default PrototypePlugin;