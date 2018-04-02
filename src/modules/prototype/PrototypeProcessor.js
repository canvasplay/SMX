/**
 * SMX Prototype Processor
 * @module PrototypeProcessor
 * @memberof smx.module:Prototype
 * @description This processor will parse and process all <prototype> nodes.
 * Uses {@link http://www.glazman.org/JSCSSP/ JSCSSP} internally.
 * @todo Try other good looking CSS parsers, like {@link https://github.com/cwdoh/cssparser.js CSSParser}
 * or {@link https://github.com/NV/CSSOM CSSOM}.
 * @todo Implement an alternative selector engine for {@link https://msdn.microsoft.com/en-us/library/ms256113(v=vs.85).aspx XSLT Patterns}.
 */

import Sizzle from 'sizzle';
import CSSParser from './CSSParser.js';

/**
 * Processes the given XMLDocument
 * @param {XMLDocument} xml
 * @param {Object} options
 * @param {Integer} [options.max_iterations=1] Maximum number of prototype blocks to process at once.
 * @param {Boolean}  [options.propagate=true] If true the processed data will be propagated to matching XML nodes.
 * @param {Function} options.callback Callback function executed on processing complete.
 * @async
 */
var processXMLDocument = function(XML,opt){

  //validate XML
  if(!XML) return;

  //normalize options
  var options = _.extend({
    data: [],
    propagate: true,
    callback: function(){ return },
    max_iterations: 1
  },opt);


  // get all <prototype> nodes in given XML
  // <prototype> nodes will get removed after processing
  var nodes = Sizzle('prototype', XML);


  log('PROCESSING PROTOTYPES... ('+ nodes.length +')');


  var iterations = 0;

  var i = 0;

  while(nodes.length && i<options.max_iterations){

      var node = nodes[i];

      var proto = processXMLNode(node);

      options.data.push(proto);

      i++;

  }


  //all nodes processed?
  if(nodes.length){

      _.delay(_.bind(function(){ processXMLDocument(XML,{
          data: options.data,
          propagate: options.propagate,
          callback: options.callback
      }) },this),0);

  }
  //ok all nodes processed!
  else{

      log('PROCESSING PROTOTYPES... DONE!');

      //reverse extracted prototypes...
      //so we apply from outter to the inner
      //so specific rules will overwrite global rules
      options.data = options.data.reverse();

      //APPLY EXTRACTED PROTOTYPES
      if(options.propagate) for (var x=0; x<options.data.length; x++) applyPrototypes(XML,options.data[x]);

      log('APPLYING PROTOTYPES... DONE!');

      log( 'COMPLETE!'); //' ('+ options.total +'/'+ options.total +') 100%' );

      try{ options.callback(XML,options.data) }
      catch(e){ log( 'CALLBACK ERROR! '+ e.toString() ) }


  }


  return
}

/**
 * Processes the given XMLNode
 * @param {XMLNode} xmlNode
 * @return {Object} data
 * @return {String} data.id
 * @return {Object[]} data.rules
 */
var processXMLNode = function(node){

  //prototype node required...
  if(!node || node.nodeName!=='prototype') return;

  var RULES = {};

  //get direct metadata parent node
  var parent = node.parentNode;

  //no parent node? wtf!!
  if(!parent) return;

  //get and remove <prototype> node from parent
  var proto = parent.removeChild(node);


  /* CSS PARSING */

  //get CSS text
  var source = proto.textContent || proto.firstChild.nodeValue; // "proto.firstChild.nodeValue" in IE8

  //Remove css comments, comments outside any rule could break CSSParser...
  //!!!WARNING, THIS IS NOT BULLETPROOF!!! empty comments like this -> /**/ wont be removed
  //needs improvement...
  source = source.replace(/\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*/g, '');


  var parser = new CSSParser();
  var sheet = parser.parse(source, false, true);


  var rules = sheet.getJSONP();
  var keys = _.keys(rules);


  for(var i=0; i<keys.length; i++){

      var key = keys[i];
      var rule = rules[key];

      //if key rule exists extend it
      if(RULES[key]) _.extend(RULES[key], rule);

      //else create key rule
      else RULES[key] = rule;


  }

  return {
      'id': parent.getAttribute('id'),
      'rules': RULES
  };
  
}




/**
 * Apply the processed data into given XMLNode
 * @param {XMLDocument} xmlDocument
 * @param {Object} data
 * @return {XMLDocument} result
 */
var applyPrototypes = function(xml,proto){

  //get target node
  //var node = Sizzle('#'+proto.id, xml)[0];
  //var XML = node || xml;

  var XML = xml;

  var RULES = proto.rules;

  var RESOLVED_PROTO_ATTRS = {};


  var applyProtoAttributes = function(node,attrs){

      var id = node.getAttribute('id') || node.getAttribute('id');

      _.each(attrs, function(value,key,list){

          //all values should/must be strings
          if (!_.isString(value)) return;

          //important flag? starting with '!'
          //important values will overwrite node attribute values
          if(value.indexOf('!')===0){

              //remove '!' so it does not apply to node attributes
              value = value.substr(1);

              //apply attr value into node using temp namespace
              node.setAttribute(key,value);

          }
          else{

              //apply using temp namespace
              if (!RESOLVED_PROTO_ATTRS[id]) RESOLVED_PROTO_ATTRS[id] = {};

              RESOLVED_PROTO_ATTRS[id][key] = value;

              //node.setAttribute('temp-'+key,value);

          }



      });


  }


  //APPLY PROTOTYPES

  _.each(RULES, function(value, key, list){

      //get matching nodes
      var nodes = Sizzle(key, XML);

      //include document itself to nodes list
      //if (Sizzle.matchesSelector(XML,key)) nodes.unshift(XML);

      //get proto attrs
      var attrs = RULES[key];

      //apply attrs to each matching node
      if (nodes.length>0 && attrs){

          _.each(nodes, function(item, index){

              applyProtoAttributes(item,attrs);

          });

      }


  });


  //APPLY RESOLVED PROTOTYPES

  _.each(RESOLVED_PROTO_ATTRS, function(attrs, nodeId, collection){


      if(!_.isString(nodeId) || nodeId==="") return;

      //var node = INDEX_CACHE[nodeId];
      //var node = Sizzle.matchesSelector(XML,'#'+nodeId);
      //var node = Sizzle.matchesSelector(XML.documentElement,'#'+nodeId);
      //WARNING!!!!!!!! IE8 FAILS!!!!
      //var node = XML.getElementById(nodeId);
      //.getElementById is not supported for XML documents
      //var node = (XML.getAttribute('id')===nodeId)? XML : Sizzle('#'+nodeId, XML)[0];
      var node = Sizzle('#'+nodeId, XML)[0];

      //node = node[0];

      if(node){
          _.each(attrs, function(value, key, list){

              if (_.isEmpty(node.getAttribute(key))){

                  node.setAttribute(key, value);

              }

          });
      }

  });


  return XML;


}



export default {
  processXMLDocument: processXMLDocument,
  processXMLNode: processXMLNode,
  applyPrototypes: applyPrototypes
};