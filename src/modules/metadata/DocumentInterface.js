/**
 * Extends {@link smx.Document Document} with metadata module methods.
 * @mixin Document-Metadata
 * @memberof smx.module:Metadata
 * @see {@link smx.Document Document}
 */
var DocumentInterface = {
  
  /**
	 * Performs a search
   * @method search
   * @instance
	 * @param {String} query
	 * @param {module:Metadata.searchOptions=} options
	 * @return {module:Metadata.searchResult[]}
   * @memberof module:Metadata.Document-Metadata
   * @see module:Metadata.searchOptions
   * @see module:Metadata.searchResult
	 */
  search(str, opts){

    let results = [];
    
    //empty or invalid str return empty results array
  	if(!_.isString(str) || str === '')
  	  return results;

    /**
  	 * The options object used as parameter in {@link module:Metadata.Node-Metadata#search .search()} method.
     * @typedef {Object} module:Metadata.searchOptions
  	 * @property {Boolean} sensitive
  	 * @property {Boolean} insensitive
  	 * @property {SMXNode} node
  	 * @property {String} selector
  	 * @property {String[]} include
  	 * @property {String[]} exclude
  	 * @see {@link module:Metadata.Document-Metadata#search Document-Metadata.search()}
  	 * @see {@link module:Metadata.Node-Metadata#search Node-Metadata.search()}
  	 */

    /**
  	 * The returning object by the {@link module:Metadata.Node-Metadata#search .search()} method, returns an array of them.
     * @typedef {Object[]} module:Metadata.searchResult
  	 * @property {SMXNode} node
  	 * @property {String} meta-key
  	 * @property {String} meta-value
  	 * @see {@link module:Metadata.Document-Metadata#search Document-Metadata.search()}
  	 * @see {@link module:Metadata.Node-Metadata#search Node-Metadata.search()}
  	 */

  	var options = _.defaults(opts||{}, {
      
      //case sensivity
      sensitive: false,
      
      //accents sensivity
      insensitive: false,
      
      //node context
      node: null,
      
      //base selector
      selector: '',
      
      //include selectors
      include: [],
      
      //exclude selectors
      exclude: []
      
    });
  
  	str = (options.sensitive)? str : str.toLowerCase();
  
  	var json;
  	var doc = this;
  
  	if(options.selector+''){
  
  		let nodes = this.find(options.selector, options.node);
  
  		let ids = _.pluck(nodes,'id');
  
  		let datas = [];
  
  		_.each(this._data.metadata, function(value, key, list){
  
  			if(_.includes(ids,key)) datas.push(value);
  
  		});
  
  		json = _.map(datas, function(data, index){ data.id = ids[index]; return data; });
  
  	}
  	else{
  
  		let ids = _.keys(this._data.metadata);
  		let values = _.values(this._data.metadata);
  
  		json = _.map(values, function(value, index){ value.id = ids[index]; return value; });
  
  	}
  
  
  
  	_.each(json, function(item){
  
  		//save id property for later use and delete it
  		//so loop wont process it and will run faster
  		var id = item.id+''; delete item.id;
  
  		_.each(item, function(value, key){
  
  			//ignore empty string and non string values...
  			var is_valid_string = ( _.isString(value) && !_.isEmpty(value) )? true : false;
  
  			if(is_valid_string){
  
  				var _value = (options.sensitive)? value : value.toLowerCase();
  
  				if(_value.indexOf(str)>=0){
  
  					results.push({
  						'node': doc.getNodeById(id),
  						'meta': key,
  						'value': value
  					});
  
  				}
  
  			}
  
  		});
  
  	});
  
  	results = _.uniq(results);
  
  
  
  	return results;

  }
  

};

export default DocumentInterface;