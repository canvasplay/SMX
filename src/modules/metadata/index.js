/**
 * Metadata Module
 * @module Metadata
 * @memberof smx
 * @description
 * Provides a flexible data layer for document's nodes.
 *
 * Using nested `<metadata>` nodes you can attach data to the direct parent node.
 * Data can be also attached to nodes using `meta-` preffixed attributes.
 *
 * ### Reserved XML: `metadata`, `[meta-*]`.
 *
 * @example
 * <book meta-ISBN="978-3-16-148410-0">
 *    <metadata>
 *      <title>Moby Dick</title>
 *      <description>
 *        Lorem ipsum dolor sit amet consectetuer...
 *      </description>
 *    </metadata>
 *    <chapter>...</chapter>
 *    <chapter>...</chapter>
 *    <chapter>...</chapter>
 * </book>
 *
 * <!-- Processed XML -->
 * <book>
 *   <!-- metadata = {
 *     'ref': '978-3-16-148410-0',
 *     'title': 'Moby Dick',
 *     'description': 'Lorem ipsum dolor sit amet consectetuer...'
 *   } -->
 *   <chapter>...</chapter>
 *   <chapter>...</chapter>
 *   <chapter>...</chapter>
 * </book>
 *
 * book.meta('ref');
 * // => "978-3-16-148410-0"
 * book.meta('title');
 * // => "Moby Dick"
 * book.children.length;
 * // => 3
 */

import MetadataProcessor from './MetadataProcessor.js';
import DocumentInterface from './DocumentInterface.js';
import NodeInterface from './NodeInterface.js';


var Processor = function(xmlDocument, _callback){
  
  var doc = xmlDocument;
  var __callback = _callback || function(){};
  
  //smx.meta.parseXML(xmlDocument, {
  MetadataProcessor.processXMLDocument(xmlDocument, {
    callback: function(xmlDocument, data){
      __callback({
        metadata: data
      });
    }
  });
  
};

export default {
  Processor: Processor,
  Document: DocumentInterface,
  Node: NodeInterface
};