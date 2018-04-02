/**
 * Extends {@link smx.Node Node} with metadata module methods.
 * @mixin Node-Metadata
 * @memberof smx.module:Metadata
 * @see {@link smx.Node Node}
 */
let NodeInterface = {
  
  /**
   * Gets the metadata value for the given key.
   * @method meta
   * @instance
   * @param {String} key
   * @return {String}
   * @memberof smx.module:Metadata.Node-Metadata
   */
  meta: function(key){
    
    try{ return this.document._data.metadata[this.id][key] }
    catch(e){}
    
  },
  
  /**
   * Gets the interpolated metadata value for the given key.
   * The interpolation uses {{}} delimiters and the node as data context.
   * @method interpolate
   * @instance
   * @param {String} key
   * @return {String}
   * @memberof smx.module:Metadata.Node-Metadata
   */
  interpolate: function(key){
    
    var settings = { interpolate: /\{\{(.+?)\}\}/g };
    try{ return _.template(this.meta(key), this, settings) }
    catch(e){}
    
  },
  
  /**
	 * Performs a search in owner document using this node as context.
   * @method search
   * @instance
   * @param {String} query
   * @param {module:Metadata.searchOptions=} options
   * @return {module:Metadata.searchResult[]}
   * @memberof smx.module:Metadata.Node-Metadata
   * @see {@link module:Metadata.searchOptions searchOptions}
   * @see {@link module:Metadata.searchResult searchResult}
   */
  search: function(str, opt){
    var options = opt || {};
    options.node = this;
    return this.document.search(str,opt);
  }
  
};

export default NodeInterface;