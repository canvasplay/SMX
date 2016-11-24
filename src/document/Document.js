(function(win){


//private aux debug system
var DEBUG = true; var LOG = function(str){ if (win.console&&win.console.log&&DEBUG) win.console.log('DOCUMENT: '+str) };


//local smx ref
var smx = win.smx;



var $smx = window['$smx'] = {};



////////////////////////////////
// PRIVATE INDEXED NODE LIST CACHE

$smx.cache = {};





////////////////////////////////
// SMX NODE

var SMXNode = function(xmlNode){

    this[0] = xmlNode;

    this.id = this[0].getAttribute('id');

    this.uid = (parseInt(_.uniqueId()).toString(36));

    this.name = this[0].nodeName;

    return this;

};

//extend SMXNode prototype
_.each(smx.fn, function(fns){

    _.extend(SMXNode.prototype,fns);

});

//expose

smx.Node = SMXNode;




////////////////////////////////
// SMX NODE WRAPPER

$smx.node = function(elems){



    var _SMXNode = function(xmlNode){

        var id = null;

        //if(!xmlNode) return;
        //if (xmlNode.nodeName == 'undefined') return;
        //if (typeof xmlNode.nodeType == 'undefined') return;
        //if (xmlNode.nodeType != 1) return;

        //can this try replace the 4 conditionals above? yes...
        try{ id = xmlNode.getAttribute('id') } catch(e){}

        //id attr is required!
        if(!id) return;

        //Does already exists a node with this id?
        //prevent duplicated nodes and return existing one
        if ($smx.cache[id]) return $smx.cache[id];

        //create new SMXNode from given XMLNode
        var node = new smx.Node(xmlNode);

        //add it to nodes cache
        $smx.cache[id] = node;

        //return just created node
        return node;

    };




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













    var SMXDocument = function(file, path, xml){


        if (!xml) return;

        if (!file) file = 'index.xml';
        if (!path) path = '';


        //using lastChild prevents getting unwanted xml node...
        //IE8 p.e. returns "ProcessingInstruction" for firstChild
        xml = xml.removeChild(xml.lastChild);

        if(!xml) return;

        //xml.setAttribute('file',file);
        //xml.setAttribute('path',path);


        //create Document from xml
        var DOCUMENT = new smx.Node(xml);

        //ensure document has been wrapped, check its [0] property
        if (!DOCUMENT || !DOCUMENT[0]) return;

        //add document to node indexed cache
        $smx.cache[DOCUMENT.id] = DOCUMENT;










        /////////////////////////////////////////////////////

        return DOCUMENT;

    };

    //expose

    smx.Document = SMXDocument;



})(window);
