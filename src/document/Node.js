(function(global, smx){



//declare and expose $smx namespace
var $smx = global['$smx'] = {};



////////////////////////////////
// PRIVATE INDEXED NODE LIST CACHE

$smx.cache = {};



////////////////////////////////
// SMX NODE

class SMXNode{
  
  constructor(xmlNode){

    //original XML node for reference
    //jquery inspired using the [0] :D
    this[0] = xmlNode;
    
  }
  
  get id(){
    return this[0].getAttribute('id');
  }
  
  get name(){
    return this[0].nodeName;
  }

  /**
   *  node type with 'smx' as default, it can also be txt, md, html, ...
   */
  get type(){
    return this[0].getAttribute('type') || 'smx';
  }

  /**
   * class attribute as array of
   */
  get className(){
    return this[0].getAttribute('class');
  }
  
  /**
   *  Uniform Resource Identifier,"url id"
   *  Calculate url hash path using cummulative ids up to root
   */
  get uri(){
    let hash = this.id + '/';
    let parent = this.parent();
    if (parent) return parent.uri + hash;
    else        return hash;
  }


  /**
   *  browser url hash for this node
   */
  get hash(){
      return '#!/'+this.uri;
  }

  /**
   *  @method url
   *  Uniform Resource Locator (url path)
   *  Calculate url folder path using cummulative paths up to root
   */

  get url(){

    let path = this.attr('path');

    let parent = this.parent();

    if (parent){
        if(!path)
            return parent.url;
        else{

            //add trail slash
            let trail = path.substr(-1);
            if (trail != '/') path += '/';

            return parent.url + path;
        }

    }
    else{

        if(!path) return;

        //add trail slash
        let trail = path.substr(-1);
        if (trail != '/') path += '/';

        return path;

    }

  }

  /**
   *  url of xml source file of this node
   */

  get file(){

    let url = '';
    let file = this.attr('file');
    let parent = this.parent();
    
    if (!file)
      return (parent)? parent.file : undefined;
      
    else
      return this.url + file;
        
  }
  

  
}

//extend SMXNode prototype

for(var key in smx.fn){

    //_.extend(SMXNode.prototype,fns);
    Object.assign(SMXNode.prototype, smx.fn[key]);

}

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



})(window, window.smx);
