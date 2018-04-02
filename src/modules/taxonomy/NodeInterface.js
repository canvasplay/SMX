/**
 * Extends SMXNode with taxonomy methods
 * @mixin Node-Taxonomy
 * @memberof smx.module:Taxonomy
 */
 
let NodeInterface = {

  /**
  * Gets the collection of associated tags.
  * @return {Array.<String>}
  * @memberof smx.module:Taxonomy.Node-Taxonomy
  */
  getTags: function(namespace){
    
    //default result is an empty array
    let results = [];
    
    //get comma separetd array from tags attribute
    let values = this.dsv('tags',',');
    
    //namespace filter
    if(_.isString(namespace) && namespace.length > 1){
        var ns = namespace;
        results = _.filter(results,function(r){
            return (r+'').indexOf(ns+'-')===0;
        });
    }
    
    return results;
    
  },


  /**
  * Gets a collection of associated categories.
  * @return {Array.<String>}
  * @memberof smx.module:Taxonomy.Node-Taxonomy
  */
  getCategories: function(namespace){
    
    //default result is an empty array
    let results = [];
    
    //get comma separetd array from tags attribute
    let values = this.dsv('categories',',');
    
    //namespace filter
    if(_.isString(namespace) && namespace.length > 1){
        var ns = namespace;
        results = _.filter(results,function(r){
            return (r+'').indexOf(ns+'-')===0;
        });
    }
    
    return results;
    
  },



  /**
  * Get the collection of associated branches.
  * @return {Array.<String>}
  * @memberof smx.module:Taxonomy.Node-Taxonomy
  */
  getBranches: function(){
    
    //default result is an empty array
    let results = [];
    
    //get comma separetd array from tags attribute
    let ids = this.dsv('branches',',');
    
    //get parent document
    var doc = this.root();
    
    //maps ids into nodes
    results = _.map(values, doc.gid);
    
    //remove not found ids from results
    results = _.compact(results);
    
    return results;

  }


};


export default NodeInterface;