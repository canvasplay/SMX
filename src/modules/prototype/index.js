/**
 * Prototype Module
 * @module Prototype
 * @memberof smx
 * @description
 *
 * The Prototype module provides a customizable XML transformation
 * layer.
 *
 * Using the key tag `<prototype>` you can define a collection of
 * transformation rules based on CSS selectors. The rules cannot modify the
 * tree, transformations are limited to attributes only. You can add,
 * remove and override attributes.
 *
 * The transformations are applied after the XML tree completes the
 * loading, while smx parsing process. `<prototype>` tags are removed once
 * they get parsed. No footprints on resultant working XML tree.
 *
 * You can think of it as CSS for XML attributes, kind of XSLT but using CSS
 * selectors instead of XSLT patterns.
 *
 * ### Reserved XML: `<prototype>`.
 *
 * @example
 * <!-- source library.xml -->
 * <library>
 *
 *    <prototype>
 *    <![CDATA[
 *
 *      //all nodes named 'book' will have a
 *      //'type' attribute with 'html' as value
 *      book{
 *        type: txt;
 *      }
 *
 *      //all nodes named 'book' having the class 'markdown' will have
 *      //an attribute 'type' with the value 'html' and
 *      //an attribute 'formatted' with the value 'true'
 *      book.markdown{
 *        type: md;
 *        formatted: true;
 *      }
 *    ]]>
 *    </prototype>
 *
 *   <book>..</book>
 *   <book>..</book>
 *   <book class="markdown">..</book>
 *
 * <library>
 *
 * <!-- processed library.xml -->
 * <library>
 *   <book type="html">..</book>
 *   <book type="html">..</book>
 *   <book class="markdown" type="md" formatted="true">..</book>
 * <library>
 */

import PrototypeProcessor from './PrototypeProcessor.js';

var Processor = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  PrototypeProcessor.processXMLDocument(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        proto: data
      });
    }
  });
  
};

export default {
  Processor: Processor
};