import Sizzle from 'sizzle';

/**
 *	util method
 *	GET_UNIQUE_ID
 *	returns unique base36 ids strings [0-9]+[a-z]
 *
 *	based on incremental integer starting at 0
 *	Native Intger.toString only handles up base 36
 *
 *  base36 [0-9]+[a-z]
 *  base62 [0-9]+[a-z]+[A-Z] but requires BigInt.js!
 *
 */

var ID_INDEX = 1;
const GET_UNIQUE_ID = () => { ID_INDEX++; return parseInt(ID_INDEX).toString(36) };
//const GET_UNIQUE_ID = ()=>{ return bigInt2str(str2bigInt(ID_INDEX+"",10,0,0),62) };
	
	
var IdAttributeParser = {
  
  /**
   * Parser name
   * @protected
   * @type {String}
   */
  name: 'Id',
  
  /**
   * Selector used to find nodes having matching attributes to be parsed
   * @protected
   * @type {String}
   */
  selector: ':not([id])',
  
  /**
   * Parser function
   * @static
   * @param {XMLDocument} xmlDocument
   * @return {XMLDocument}
   */
  parse: function(xmlDocument){
    
    //get ids already in use inside xmlDocument
    var nodes_with_id_attr = Sizzle('[id]', xmlDocument);
    var ids_in_use = nodes_with_id_attr.map(function(n){ return n.id });
    
    //get nodes matching the parser selector
    var nodes = Sizzle(this.selector, xmlDocument);
    
    //iterate over all matching nodes
    for(var i=0, len=nodes.length; i<len; i++){
      
      //get node
      var node = nodes[i];
      
      //generate an unique id for the node
      var id = GET_UNIQUE_ID();
      while(ids_in_use.indexOf(id)>0)
        id = GET_UNIQUE_ID();
      				
      //add new id to list
      ids_in_use.push(id);
      			
      //set node id
      node.setAttribute('id',id);
      
    }
    
    log('ATTRIBUTE PARSER: ID ('+ nodes.length +' nodes)');
    
    return xmlDocument;
    
  }
  
};

//expose to smx namespace
export default IdAttributeParser;