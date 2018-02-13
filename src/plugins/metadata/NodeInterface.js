/**
 * Extends SMXNode with metadata module methods.
 * @mixin Node-Metadata
 * @memberof module:Metadata
 */
let NodeInterface = {
  
  /**
   * Gets the metadata value for the given key
   * @method meta
   * @param {String} key
   * @return {String}
   * @memberof module:Metadata.Node-Metadata
   */
  meta: function(key){
    
    try{ return this.document.metadata[this.id][key] }
    catch(e){}
    
  },
  
  /**
   * Gets the interpolated metadata value for the given key
   * @method interpolate
   * @param {String} key
   * @return {String}
   * @memberof module:Metadata.Node-Metadata
   */
  interpolate: function(key){
    
    var settings = { interpolate: /\{\{(.+?)\}\}/g };
    try{ return _.template(this.meta(key), this, settings) }
    catch(e){}
    
  },
  
  /**
	 * Performs a search
   * @method search
	 * @param {String} query
	 * @param {module:Metadata.searchOptions=} options
	 * @return {Object[]}
   * @memberof module:Metadata.Node-Metadata
   * @see module:Metadata.searchOptions
   * @see module:Metadata.searchResults
   */
  search: function(str, opt){
    var options = opt || {};
    options.node = this;
    return this.document.search(str,opt);
  }
  
};

export default NodeInterface;