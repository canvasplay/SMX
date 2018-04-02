/**
 * Taxonomy Module
 * @module Taxonomy
 * @memberof smx
 * @description Lorem ipsum dolor sit amet consectetuer adipiscing elit aliquet amet
 */

import TaxonomyProcessor from './TaxonomyProcessor.js';
import NodeInterface from './NodeInterface.js';


var Processor = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  TaxonomyProcessor.processXMLDocument(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        taxonomy: data
      });
    }
  });
  
};

export default {
  Processor: Processor,
  Node: NodeInterface
};