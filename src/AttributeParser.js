(function(global, smx, Sizzle, LOG){

//normalize all attributes refering time values
var parseTime = function(value, _default){

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

};
  			
var TimeAttributeParser = {
  
  /**
   * Parser name
   * @type {String}
   * @protected
   */
  name: 'Time',
  
  /**
   * Selector used to find nodes having matching attributes to be parsed
   * @type {String}
   * @protected
   */
  selector: '[duration],[start],[offset]',
  
  /**
   * Parser function
   * @static
   * @param {XMLNode} xml
   * @return {XMLNode}
   */
  parse: function(xml){
    
    //internal counters
    var nodeCounter = 0, attributeCounter = 0;
    
    //get nodes matching the parser selector
    var nodes = Sizzle(this.selector, xml);
    
    //iterate over all matching nodes
    for(var i=0, len=nodes.length; i<len; i++){
      
      //get node
      var node = nodes[i];

      //duration attr
      var duration = node.getAttribute('duration');
      if(duration){
        node.setAttribute('duration', parseTime(duration, 'auto') );
        attributeCounter++;
      }
      
      //start attr
      var start = node.getAttribute('start');
      if (start){
        node.setAttribute('start', parseTime(start, 'auto') );
        attributeCounter++;
      }
      
      //offset attr
      var offset = node.getAttribute('offset');
      if (offset){
        node.setAttribute('offset', parseTime(offset, 0) );
        attributeCounter++;
      }
      
    }
      
    LOG('TIME ATTRIBUTES PARSED ('+ attributeCounter.length +' attributes in '+ nodes.length +' nodes)');
      
    return xml;
    
  }
  
}

//expose to smx namespace
smx.AttributeParsers.push(TimeAttributeParser);

})(window, window.smx, window.Sizzle, window.log);