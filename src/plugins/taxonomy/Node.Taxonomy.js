(function(global, _, smx){


/**
 * Extends SMXNode with taxonomy methods
 * @mixin Node-Taxonomy
 */
 
let NodeTaxonomyInterface = {

    /**
    * get collection of node's tags
    * @memberof Node-Taxonomy
    * @return {Array.<String>}
    */
    tags: function(namespace){
      
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
    * get collection of categories
    * @memberof Node-Taxonomy
    * @return {Array.<String>}
    */
    categories: function(namespace){
      
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
    * get collection of node's branches
    * @memberof Node-Taxonomy
    * @return {Array.<String>}
    */
    branches: function(){
      
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



//extends smx fn methods
smx.fn = smx.fn || {};
smx.fn = Object.assign(smx.fn, NodeTaxonomyInterface);



})(window, window._, window.smx);
