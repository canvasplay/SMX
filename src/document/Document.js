/**
*
*   @Module Node
*
*/

(function(smx){
 


////////////////////////////////
// PRIVATE SELECTOR ENGINE SHORTCUT
// defined out of constructor, so multiple SMXDocuments will use same shortcut instance
var _SIZZLE = Sizzle;




/**
 *  CORE ATTRIBUTES
 *
 *  Every smx node will have these attributes
 *  Default attributes values are overwritten by values in xml
 *
 *  @module SMXCoreAttributes
 *  @submodule SMXNode
 *
 */ 

var _ATTRIBUTES = {

    'id': '',

    'path': '',

    'file': '',

    'type':'smx',

    'category':''

};


/**
 *  COMPUTED ATTRIBUTES
 *
 *  Function returning calculated values from core attributes
 *
 *  @module SMXComputedAttributes
 *  @submodule SMXNode
 *
 */ 

var _COMPUTED_ATTRIBUTES = {

    /**
     *  @method uri
     *  Uniform Resource Identifier,"url id"
     *  Calculate url hash path using cummulative ids up to root
     */ 

    'uri' : function(node){

        var hash = node.id + '/';
        var parent = node.parent();
        if (parent) return parent.get('uri') + hash;
        else        return hash;

    },


    /**
     *  @method url
     *  Uniform Resource Locator (url path)
     *  Calculate url folder path using cummulative paths up to root
     */

    'url': function(node){

        var path = node.get('path');

        var parent = node.parent();

        if (parent){
            if(_.isEmpty(path))
                return parent.get('url');
            else{

                //add trail slash
                var trail = path.substr(-1);
                if (trail != '/') path += '/';

                return parent.get('url') + path;
            }
                
        }
        else{

            if(_.isEmpty(path)) return;

            //add trail slash
            var trail = path.substr(-1);
            if (trail != '/') path += '/';

            return path;

        }

    },

    /**
     *  @method file
     *  url of xml source file of this node
     */

    'file': function(node){

        var url = '';
        var file = node.attr('file');
        var parent = node.parent();

        if (_.isEmpty(file)){

            if (!parent) return;
            return parent.get('file');

        }
        else{

            var url = node.get('url');
            return url + file;
            

        }

    },

    /**
     *  @method index
     *  position in parent children
     */

    'index': function(node){

        var index = -1;

        var parent = node.parent();

        index = parent.children().indexOf(node);

        return index;

    }
};








//private namespace for SMX functions
var fn = {};



//////////////////////////
// ATTRIBUTE GETTERS

fn.AttributeGetters = {


    /**
    * 
    *   Get the raw value for specified attribute key in the original xml node
    *
    *   @method raw
    *   @param key {string} The name of the attribute
    *   @return {string} resulting value
    *
    */

    raw:function(key){
          
        return this[0].getAttribute(key);

    },


    /**
    * 
    *   Get the value for specified attribute key in attributes collection
    *
    *   @method attr
    *   @param key {string} The name of the attribute
    *   @return {string} resulting value
    *
    */

    attr:function(key){
        
        if(_.isUndefined(this.attributes[key])) return this.raw(key);
        return this.attributes[key];
    },


    /**
    * 
    *   Get the value for specified computed attribute key
    *   If there is no computed attribute with given key will use attr method
    *
    *   @method get
    *   @param key {string} The name of the attribute
    *   @return resulting value
    *
    */

    get:function(key, options){

        //key is required to be non empty string
        if(_.isEmpty(key) || !_.isString(key)) return;

        //try using defined attribute getter
        var getter = _COMPUTED_ATTRIBUTES[key];
        if(_.isFunction(getter)) return getter(this,options);

        //use default attr getter
        return this.attr(key);

    }



};






fn.CoreMethods = {

    //return serialization of original XML node
    toString: function(){

        //return (window.ActiveXObject)? this[0].xml : (new XMLSerializer()).serializeToString(this[0]);

        //this looks better for console loggin...
        //is this method being used anywhere else?..

        return this.name + '#' + this.id;

    },  

    //return serialization of original XML node
    getInnerHTML: function(){

        var childs = this[0].childNodes;

        var str = '';

        if (childs.length){
            _.each(childs,function(item,index){
                str+= item.xml || (new XMLSerializer()).serializeToString(item);
            });
        }

        return str;

    }



};


//////////////////////////
// TREE NODE OPERATIONS


fn.TreeNodeMethods = {


    // PARENT RELATED OPERATIONS


        /**
        *   @method parent
        */
        parent: function(){
            return _SMX(this[0].parentNode);
        },     
        
        /**
        *   @method parents
        */
        parents: function(){
        
            if (!this[0].parentNode) return [];
            else{
                var parent = this.parent();
                var parents = [parent];
                while (parent.parent()){
                    parent = parent.parent();
                    parents.unshift(parent);
                }
                return parents;
            }
        },

        /**
        *   @method root
        *   Find top most parent
        */

        'root': function(){

            if (this.parent()){

                //get all ancestors
                var parents = this.parents();

                //return top most parent node
                return parents[0];

            }
            
            return this;

        },


        // EXTRA - PARENT RELATED OPERATIONS
       
        /**
        *   @method isParentOf
        */
        isParentOf: function(node){
        
            //validate given node (smx node required)
            if (!node.parents) return false;

            var parents = node.parents();          
            if (_.contains(parents,this)) return true;
            else return false;

        },

        /**
        *   @method isParentOf
        */
        hasParent: function(node){
        
           return (this[0].parentNode)? true : false;

        },


    // CHILD RELATED OPERATIONS


        /**
        *   @method find
        */
        find: function(selector){

            if (!this[0].childNodes.length>0) return [];
            if (!_.isString(selector) || _.isEmpty(selector)) return [];

            //var query = selector || '>';
            var query = selector;

            //get search context
            var nodes = [];
            try{ nodes = _SIZZLE(query,this[0]); }
            catch(e){}      

            if(_.isArray(nodes)) nodes = _.unique(nodes);

            //return smx node array
            return _SMX(nodes);
        },            


        /**
        *   @method one
        *   Like find but returns only first matching node
        */
        one: function(selector){

            if (!this[0].childNodes.length>0) return;
            if (!_.isString(selector) || _.isEmpty(selector)) return;

            //var query = selector || '>';
            var query = selector;

            //get search context
            var nodes = [];
            try{ nodes = _SIZZLE(query,this[0]); }
            catch(e){}      

            var node = nodes[0];

            //return smx node
            return _SMX(node);

        },        


        /**
        *   @method children
        */
        children: function(){
            return _SMX(this[0].childNodes);
        },

        
        /**
        *   @method first
        */
        first : function(){
            return _SMX(_.first(this[0].childNodes));

        },

        
        /**
        *   @method last
        */
        last : function(){
            return _SMX(_.last(this[0].childNodes));
        },

        

        // EXTRA - CHILD RELATED OPERATIONS 

        /**
        *   @method childAt
        */
        childAt : function(index){
            return _SMX(this[0].childNodes[index]);
        },       




    // SIBLING RELATED OPERATIONS


        /**
        *   @method next
        */
        next : function(){
            return _SMX(this[0].nextSibling);
        },

        /**
        *   @method previous
        */

        previous : function(){
            return _SMX(this[0].previousSibling);
        },
        


    // FLAT TREE SIBLINGS

        /**
        *   @method getStepBack
        */
        stepBack: function(){

            //previousSibling?
            var _prev_sibling_node = this.previous();
            if(_prev_sibling_node) return _prev_sibling_node;
            
            //parentNode?
            var _parent_node = this.parent();
            if(_parent_node) return _parent_node;
            
            //nothing found...
            return;
            
        },
        
        /**
        *   @method getStepForward
        */
        stepForward: function(from_last_child){
            
            //in recursive calls indicate if last recursion come from lastChild of its parent
            var _from_last_child = (from_last_child)? from_last_child : false;
            
            // 1. use children, trying to get deep inside node
            // if (_from_last_child) means we arleady searched on childNodes and avoid it
            // we avoid children when content is not smx
            if (!_from_last_child && this.get('type')==='smx' ){
                var _first_childnode = this.first();
                return _first_childnode;
            }
                
            //2. search nextSibling:
            var _next_sibling_node = this.next();
            if(_next_sibling_node) return _next_sibling_node;
            
            //3. search on parentNode
            var _parent_node = this.parent();
            if(_parent_node) return _parent_node.stepForward(true);
            
            //4. nothing found: return null!!
            return;
            
        }

};






////////////////////////////////
// TIMELINE LOGIC

fn.TimelineLogic = {

                
    /**
    *   @method isInsideTimeline
    */
    isInTimeline:function(){
        var is_in_timeline = false;
        var is_timeline = this.isTimeline();
        if(is_timeline){
            return false;
        }
        else{
            
            var parent = this.parent();
            while(parent && !parent.isTimeline()){
                parent = parent.parent();
            }

            if(!parent) return false;
            else if(parent.isTimeline()) return true;
            else return false;

        }

    },


    /**
    *   @method synchronize
    */
    synchronize: function(){

        //get 'timing' attribute value
        var sync = this.getTiming();

        //check if node need to be sync
        if (!sync || sync == 'none'){

            this.duration=0;
            this.start=0;

            //do not use 'sync' attribute so flag it with 'is-sync'
            this[0].setAttribute('is-sync','true');

            return;   
        }


        //update sync values (start, duration)
        var force_sync = true;
        var duration = this.getDuration(force_sync);
        var start = this.getStart(force_sync);

        return;
    },

                
    /**
    *   @method getStart
    */
    getStart : function(force_sync){
    
        //bool flag use or not local value if exists
        if (!force_sync){
            //has local value?
            if(_.isNumber(this.start)) return this.start;
        }

        //get it from attribute
        var start = parseInt(this[0].getAttribute('start'));
        if(_.isNaN(start) || start<0) start = 0;

        //set local value
        this.start = start;

        //return local value
        return start;
        
    },

                
    /**
    *   @method getDuration
    */
    //get duration of this node based on getDuration of child nodes
    //@return: Number
    getDuration : function(force_sync){
    
        //bool flag use or not local value if exists
        if (!force_sync){
            //has local value?
            if(_.isNumber(this.duration)) return this.duration;
        }

        //has duration attribute?
        var duration = parseInt(this[0].getAttribute('duration'));
        if(_.isNaN(duration) || duration<0) duration = NaN;

        //sync start for 
        var start = this.getStart();

        //try child summatory
        if (_.isNaN(duration)){
            var childs = this.children();
            childs = childs.reverse();
            if(childs.length>0){
                // childs will define duration using 
                // the child with the highest offset+duration value
                var max = 0;
                for(var n=0; n<childs.length;n++){
                    var child = childs[n];
                    var sum = child.offset() + child.getDuration(force_sync);
                    if(sum>max) max = sum;
                }
                duration = max;
            }
            else if(!this.getNext() && !this.getPrevious()){
                duration = 0;
            }
        }

        
        //check next sibling dependencies
        if (_.isNaN(duration) && this.isInTimeline()){

            //get parent
            var parent = this.parent();

            if(parent && _.isNumber(parent.duration)){

                //get next sibling with absolute timing 
                var next = this.getNext();
                var target = null;
                while(next && !target){
                    if(next.getTiming() == 'absolute')  target = next;
                    else                                next = next.getNext();
                }

                if(target){
                    if (_.isNumber(target.start) && _.isNumber(this.start)){
                        duration = parseInt(next.offset()-this.start);    
                        if(_.isNaN(duration) || duration<0) duration=NaN; 
                    }
                }
                else{
                    duration = parseInt(parent.duration-this.start);    
                    if(_.isNaN(duration) || duration<0) duration=NaN; 
                } 
            }
            else{
                duration = NaN;
            }

        }

        if (_.isNaN(duration) && !this.isInTimeline()){
            duration = 0;                    
        }

        //could not determine duration? set to 0
        if(_.isNaN(duration)){
            duration = 0;
        }
        else{
            //create sync flag attribute
            this[0].setAttribute('is-sync','true');
        }

        //set local value
        this.duration = duration;

        //return local value
        return this.duration;
        
    },

                
    /**
    *   @method offset
    */
    offset : function(from){
    


        
    },

                
    /**
    *   @method getEndTime
    */
    getEndTime : function(){
        return this.getStart() + this.getDuration();
    }


};




////////////////////////////////
// META INTERFACE
// 'meta' attributes namespace

fn.MetaInterface = {
    
                
    /**
    *   @method meta
    */
    meta: function(key){

        //if exists MetaManager, use it
        if(METADATA) return METADATA.get(this.id,key);

        //else look for key in attributes
        var attrs = this[0].attributes;
        var value = null;
        for(var i = 0; i < attrs.length; i++) {
            var attr_name = attrs[i].name+'';
            var attr_value = attrs[i].name+'';
            if(attr_name.indexOf("meta-") == 0){
                attr_name = attr_name.substr(5);
                if(attr_name == key) value = attrs[i].value;
            }
            if(value) i=attrs.length;
        }

        return value;
        
    }


};




////////////////////////////////
// TRACK INTERFACE
// 'track' attributes namespace

fn.TrackAttrInterface = {

                            
    /**
    *   @method isAccesible
    */
    isAccesible: function(){

        var access_raw = this.track('access','raw');

        if(_.isEmpty(access_raw) || access_raw == 'none')
            return true;

        var access = parseInt(this.track('access'));

        if(_.isNumber(access) && access!=0) return false;
        else{

            var parent = this.parent();

            if(parent){
                return parent.isAccesible();        
            }
            else{
                return true;
            }
            
        }

    },

                            
    /**
    *   @method track
    */
    track: function(key, format){

        //if exists (TRACKING) TrackManager use it
        if(TRACKING) return TRACKING.get(this.id,key,format);

        //else look for key in attributes
        var attrs = this[0].attributes;
        var value = null;
        for(var i = 0; i < attrs.length; i++) {
            var attr_name = attrs[i].name+'';
            var attr_value = attrs[i].name+'';
            if(attr_name.indexOf("track-") == 0){
                attr_name = attr_name.substr(6);
                if(attr_name == key) value = attrs[i].value;
            }
            if(value) i = attrs.length;
        }

        return value;
        
    },

    /**
    *   Returns true if Tracking Module is handling the given key 
    *   @method isTracking
    *   @param {String} key
    *   @return {Boolean} result
    */
    isTracking: function(key){

        if(!key){
        //check for root track attr
            var value = this[0].getAttribute('track');

            if(value=='none') return false;

            return true;

        }
        else{
        //check for given key track attr

            //get track-key attr value from xml source node
            var value = this[0].getAttribute('track-'+ key);

            if (_.isUndefined(value) || _.isNull(value) || value=='none')
                return false;

            return true;
            

        }

        return;

    }

};





////////////////////////////////
// UI ATTRIBUTES INTERFACE
// shortcut for UIAttrController.get()

fn.UIAttrInterface = {
                          
    /**
    *   @method ui
    */
    ui: function(key,type){

        return smx.UIAttrController.get(this,key,type);

    }


};



////////////////////////////////
// TIME INTERFACE
// 'time' attributes namespace

fn.TimeInterface = {
    
                
    /**
    *   @method media
    */
    time: function(key){

        return smx.TimeAttrController.get(this,key);
    }


};




        var METADATA = null;
        var TRACKING = null;



        ////////////////////////////////
        // PRIVATE INDEXED NODE LISTING CACHE
        // inside constructor so each document uses its own cache
        var INDEX_CACHE = {};



        ////////////////////////////////
        // PRIVATE SMX NODE WRAPPER

        var _SMX = function(elems){

            if (elems && (_.isArray(elems) || !_.isUndefined(elems.length)) && _.isUndefined(elems.nodeType)) {
                var result = [];
                for (var i=0; i< elems.length; i++){
                    if (elems[i]){
                        var node = (elems[i][0])? elems[i] : _SMXNode(elems[i]);
                        if (node) result.push(node);                     
                    }
                }
                return result;
            }
            else if(elems) {
                if(elems[0])    return elems;
                else            return _SMXNode(elems);
            }
            else return;

        }; 


        ////////////////////////////////
        // PRIVATE SMX NODE CONSTRUCTOR FILTER

        var _SMXNode = function(xmlNode){

            var id = null;

            //if(!xmlNode) return;
            //if (xmlNode.nodeName == 'undefined') return;
            //if (typeof xmlNode.nodeType == 'undefined') return;
            //if (xmlNode.nodeType != 1) return;

            //is this uncatched try an alternative to
            //the 4 conditionals above?
            try{ id = xmlNode.getAttribute('id') } catch(e){}

            //id attr is required!
            if(!id) return;

            //Does already exists a node with this id?
            //prevent duplicated nodes and return existing one
            if (INDEX_CACHE[id]) return INDEX_CACHE[id];

            //create new SMXNode
            var node = new SMXNode(xmlNode);

            //add it to nodes cache
            INDEX_CACHE[id] = node;
            
            //return just created node
            return node;


        };



        ////////////////////////////////
        // PRIVATE SMX NODE CONSTRUCTOR

        var SMXNode = function(xmlNode){

            this[0] = xmlNode;

            //console.log('NODETYPE:' + this[0].nodeType);

            this.id = this[0].getAttribute('id');

            this.name = this[0].nodeName;

            this.attributes = {};

            var _this = this;

            _.each(_ATTRIBUTES,function(value, key, collection){

                _this.attributes[key] = _this[0].getAttribute(key) || value;

            });

            return this;

        };

        _.extend(SMXNode.prototype,fn.CoreMethods);
        _.extend(SMXNode.prototype,fn.TreeNodeMethods);
        _.extend(SMXNode.prototype,fn.AttributeGetters);

        _.extend(SMXNode.prototype,fn.UIAttrInterface);
        _.extend(SMXNode.prototype,fn.MetaInterface);
        _.extend(SMXNode.prototype,fn.TimeInterface);
        _.extend(SMXNode.prototype,fn.TrackAttrInterface);





    var SMXDocument = function(file, path, xml){


        if (!xml) return;

        if (!file) file = 'index.xml';
        if (!path) path = '';








        ////////////////////////////////
        // INITIALIZE DOCUMENT


        //get 1st node with tag body
        var body = xml.getElementsByTagName('body')[0];




        //break parent node in body
        body = body.parentNode.removeChild(body);

        //add core attributes
        body.setAttribute('file',file);
        body.setAttribute('path',path);


        //create Document from body node
        var DOCUMENT = _SMX(body);

        //ensure document has been wrapped, check its [0] property
        if (!DOCUMENT || !DOCUMENT[0]) return;

        //add document to node indexed cache
        INDEX_CACHE[DOCUMENT.id] = DOCUMENT;


        //OVERRIDES DEFAULT NODE METHODS
        //WITH DOCUMENT METHODS
        _.extend(DOCUMENT,{
            getNodeById: function(id){ 
                        
                //is nodes cache array?
                if(INDEX_CACHE[id]) return INDEX_CACHE[id];

                //search in document
                var node = _SIZZLE('#'+id,this[0]);
                if (node.length>0) return _SMX(node[0]);

                //not found
                return; 
                  
            }

        });




        ////////////////////////////////
        // DOCUMENT PROTOTYPES


        var PROTO = {};

        try{

            //get head element
            var head = xml.getElementsByTagName('head')[0];

            //get all "prototype" elements inside head
            var _prototypes_ = head.getElementsByTagName('prototype');

            //prototypes collection to store evaluated "prototype" elements
            var prototypes = [];

            //loop prototype elements and try to evaluate its content
            _.each(_prototypes_, function(item, index, list){


                /* JSONP

                //try evalualting text content and add it to prototypes collection
                try{
                    prototypes.push( eval( '('+ item.firstChild.nodeValue +')' ) );
                    LOG('OK EVALUATING PROTOTYPES FROM "'+ item.getAttribute('file') +'"');
                }
                catch(e){
                    LOG('ERROR EVALUATING PROTOTYPES FROM "'+ item.getAttribute('file') +'"');
                }

                */

                /* CSS PARSING */

                var source = item.firstChild.nodeValue;

                var parser = new CSSParser();
                var sheet = parser.parse(source, false, true);

                prototypes.push( sheet.getJSONP() );


            });

            //loop prototypes collection
            _.each(prototypes, function(item, index, collection){

                //loop prototype rules and propagate it into root PROTO object
                _.each(item, function(value, key, list){

                    //if key rule exists extend it
                    if(PROTO[key]) _.extend(PROTO[key], value);
                    //else create key rule
                    else PROTO[key] = value;

                });

            });

            if (prototypes.length === 0){
                LOG('DOCUMENT HAS NO PROTOTYPES');
            }
            else{
                LOG('DOCUMENT PROTOTYPES PROCESSING COMPLETED');   
            }

        }
        catch(e){

            LOG('ERROR PROCESSING DOCUMENT PROTOTYPES');

        }

                    
        DOCUMENT.proto = PROTO;



        /////////////////////////////////////////////////////
        //
        // APPLY PROTOTYPES
        //
        /////////////////////////////////////////////////////


        var getProtoAttributes = function(selector){

            //get proto object
            var proto = PROTO[selector];

            //proto does not exists
            if(!proto) return;

            //create new object extended from proto
            var attrs = _.extend({}, proto);

            //check if 'ext' attribute exists
            //'ext' is the id of the prototype of which is extended
            if (!_.isUndefined(attrs['ext'])){

                //get ext value
                var ext = attrs.ext;

                //delete ext attr, so it does not apply to nodes
                //delete attrs.ext; equals to undefined is faster than delete
                attrs.ext = undefined;

                //get ext proto attributes
                var ext_attrs = getProtoAttributes(ext);

                //if ext proto attrs recived, extend attrs with ext attrs
                if (ext_attrs) attrs = _.extend(attrs,ext_attrs);

            }

            return attrs;

        }

        var TEMP_PROTO_ATTRS = {};


        var applyProtoAttributes = function(node,attrs){

            var id = node.id;

            _.each(attrs, function(value,key,list){

                //string value is required
                if (!_.isString(value)) return;

                //if value starts with '!' is taken as important
                //important values will overwrite node attribute values
                if(value.indexOf('!')===0){

                    //remove '!' so it does not apply to node attributes
                    value = value.substr(1);

                    //apply attr value into node using temp namespace
                    node[0].setAttribute(key,value);     

                }
                else{

                    //apply using temp namespace
                    if (!TEMP_PROTO_ATTRS[id]) TEMP_PROTO_ATTRS[id] = {};

                    TEMP_PROTO_ATTRS[id][key] = value;

                    //node[0].setAttribute('temp-'+key,value);

                }



            });


        }


        //APPLY PROTOTYPES

        _.each(PROTO, function(value, key, list){

            //get matching nodes
            var nodes = DOCUMENT.find(key);

            //include document itself
            if (_SIZZLE.matchesSelector(DOCUMENT[0],key)) nodes.unshift(DOCUMENT);

            //no matching nodes?
            if (nodes.length===0) return;

            //get proto attrs
            var attrs = getProtoAttributes(key);

            //apply attrs to each matching node
            _.each(nodes, function(item, index){

                applyProtoAttributes(item,attrs);

            });


        });


        _.each(TEMP_PROTO_ATTRS, function(attrs, node_id, collection){

            var node = INDEX_CACHE[node_id];

            _.each(attrs, function(value, key, list){

                if (_.isEmpty(node[0].getAttribute(key))){

                    node[0].setAttribute(key, value);

                }

            });

        });





        /*

        /////////////////////////////////////////////////////
        //
        // SYNCHRONIZE DOCUMENT
        //
        /////////////////////////////////////////////////////

        //this call should synchronize whole document
        //by synchronize we are meaning the initialization
        //of 'start' and 'duration' attributes of a node

        //max loop recursion
        var max = 25; var n =0;

        //get all unsync nodes
        //at this point all nodes should be unsync
        var unsync = DOCUMENT.children('* :not([is-sync])');

        //add document itself to unsync nodes
        unsync.unshift(DOCUMENT);

        //count nodes for sync
        var total = unsync.length;

        console.log('SYNC '+ total);

        while( n<max && unsync.length>0 ){

            //reverse nodes array
            //sync from end to begin and from inside to outside
            unsync = unsync.reverse();

            //loop call 'synchronize'
            for (var i=0;i<unsync.length;i++){
                unsync[i].synchronize();
            }

            //get nodes that still unsync
            unsync = DOCUMENT.children('* :not([is-sync])');

            console.log('SYNC ('+(total-unsync.length) +'/'+ total+')');

            n++;
        }

        if(unsync.length>0)     console.log('SYNCHRONIZE FAILED ('+(total-unsync.length) +'/'+ total+')');
        else                    console.log('SYNCHRONIZED '+(total-unsync.length));

        
        /////////////////////////////////////////////////////

        */


        // SETUP PLAYHEAD
        DOCUMENT.playhead = new smx.Playhead(DOCUMENT);


        // SETUP METADATA
        METADATA = new smx.meta.MetaManager(DOCUMENT);
        DOCUMENT.metadata = METADATA;


        // SETUP TRACKING
        TRACKING = new smx.tracking.TrackManager(DOCUMENT);
        DOCUMENT.tracking = TRACKING;
        //call initial tracking 'update'
        TRACKING.update();



        /////////////////////////////////////////////////////

        return DOCUMENT;

    };

    //expose

    smx.Document = SMXDocument;



})(window.smx);