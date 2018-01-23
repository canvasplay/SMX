(function(global, smx, Sizzle, LOG){

/**
 * @mixin TimeAttributeParser
 */
  			
var TimeAttributeParser = {
  
  /**
   * Parser name
   *
   * @memberof TimeAttributeParser
   * @type {String}
   * @protected
   */
  name: 'Time',
  
  /**
   * Selector used to find nodes having matching attributes to be parsed
   *
   * @memberof TimeAttributeParser
   * @type {String}
   * @protected
   */
  selector: '[duration],[start],[offset]',
  
  /**
   * Parser function
   *
   * @memberof TimeAttributeParser
   * @static
   * @param {XMLNode} xml
   * @return {XMLNode}
   */
  parse: function(xml){
    
    //internal counter
    var attributeCounter = 0;
    
    //get nodes matching the parser selector
    var nodes = Sizzle(this.selector, xml);
    
    //includes xml root itself to the list
    if(Sizzle.matchesSelector(xml,this.selector))
      nodes.unshift(xml);
    
    //iterate over all matching nodes
    for(var i=0, len=nodes.length; i<len; i++){
      
      //get node
      var node = nodes[i];
      
      //duration attr
      var duration = node.getAttribute('duration');
      if(duration){
        node.setAttribute('duration', this.parseAttributeValue(duration, 'auto') );
        attributeCounter++;
      }
      
      //start attr
      var start = node.getAttribute('start');
      if (start){
        node.setAttribute('start', this.parseAttributeValue(start, 'auto') );
        attributeCounter++;
      }
      
      //offset attr
      var offset = node.getAttribute('offset');
      if (offset){
        node.setAttribute('offset', this.parseAttributeValue(offset, 0) );
        attributeCounter++;
      }
      
    }
      
    LOG('ATTRIBUTE PARSER: TIME ('+ attributeCounter +' attributes in '+ nodes.length +' nodes)');
      
    return xml;
    
  },
  
  /**
   * Parses a time attribute value
   *
   * @memberof TimeAttributeParser
   * @static
   * @param {String} value
   * @param {String} default value
   * @return {String}
   */
  parseAttributeValue: function(value, _default){
  
  	if( !value || typeof value !== 'string' || value === 'auto' || value<0 )
  		return _default;
  
  	var important = false;
  	if(value.indexOf('!')===0){
  		important = true;
  		value = value.substr(1);
  	}
  
  	if (value.indexOf(':')>=0){
  
  		var sum=0, factor=1, values=(value).split(':');
  		values.reverse();
  		for (var i = 0; i<values.length; i++){
  			sum += parseFloat(values[i])*factor;
  			factor = factor*60;
  		}
  
  		if (important) 	return '!'+sum;
  		else 			return sum;
  	}
  
  	if (important) 	return '!'+parseFloat(value);
  	else 			return parseFloat(value);
  
  }
  
}

//expose to smx namespace
smx.AttributeParsers.push(TimeAttributeParser);

})(window, window.smx, window.Sizzle, window.log);