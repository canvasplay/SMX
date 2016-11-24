(function(global, _, smx){



let methods = {

    /**
    *   @method tags
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
    *   @method categories
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
    *   @method categories
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



//expose to global
smx.fn = _.extend(smx.fn,{ TaxonomyAttrInterface: methods });



})(window, window._, window.smx);
