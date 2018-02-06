////////////////////////////////
// smx plugin
// PROTOTYPE PARSER
// This plugins process all <prototype> nodes
// convert first level children nodes into meta-* attributes
// and apply those attributes to direct parent node


(function(global, Sizzle, smx){
 

    //private aux debug system
    var DEBUG = true; var LOG = function(str){ if (global.console&&global.console.log&&DEBUG) global.console.log('PROTOTYPE '+str) };


    var PrototypeProcessor = {};


    PrototypeProcessor.parseXML = function(XML,opt){

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
        // <prototype> nodes will get removed after parse process
        var nodes = Sizzle('prototype', XML);


        LOG('PARSING PROTOTYPES... ('+ nodes.length +')');


        var iterations = 0;

        var i = 0;

        while(nodes.length && i<options.max_iterations){

            var node = nodes[i];

            var proto = this.parseXMLNode(node);

            options.data.push(proto);

            i++;

        }


        //all nodes parsed?
        if(nodes.length){

            _.delay(_.bind(function(){ this.parseXML(XML,{
                data: options.data,
                propagate: options.propagate,
                callback: options.callback
            }) },this),0);

        }
        //ok all nodes parsed!
        else{

            LOG('PARSING PROTOTYPES... DONE!');

            //reverse extracted prototypes...
            //so we apply from outter to the inner
            //so specific rules will overwrite global rules
            options.data = options.data.reverse();

            //APPLY EXTRACTED PROTOTYPES
            if(options.propagate) for (var x=0; x<options.data.length; x++) this.applyPrototypes(XML,options.data[x]);

            LOG('APPLYING PROTOTYPES... DONE!');

            LOG( 'COMPLETE!'); //' ('+ options.total +'/'+ options.total +') 100%' );

            try{ options.callback(XML,options.data) }
            catch(e){ LOG( 'CALLBACK ERROR! '+ e.toString() ) }


        }


        return
    }


    PrototypeProcessor.parseXMLNode = function(node){

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
    



    PrototypeProcessor.applyPrototypes = function(xml,proto){

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




    //expose into global smx namespace
    smx.proto = PrototypeProcessor;



})(window, window.Sizzle, window.smx);