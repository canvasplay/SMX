(function(global, _, smx){
  
  
class SMXFinder{
  
  constructor(doc){
    
    //SMXDocument to find in
    this.document = doc;
    
    //default options object
    this.options = {
    
      //base selector
      selector: '',
      
      //case sensivity
      sensitive: false,
      
      //accents sensivity
      insensitive: false,
      
      //include selectors
      include: [],
      
      //exclude selectors
      exclude: [],
      
      //tags
      tags: []
      
    };
    
    
  }
  
  
  find(str, opts){

    let results = [];
    
    //empty or invalid str return empty results array
  	if(!_.isString(str) || str === '')
  	  return results;

  	var options = _.defaults(opts||{},this.options);
  
  	str = (options.sensitive)? str : str.toLowerCase();
  
  	var doc = this.document;
  
  	var json;
  
  	if(options.selector+''){
  
  		let nodes = doc.find(options.selector);
  
  		let ids = _.pluck(nodes,'id');
  
  		let datas = [];
  
  		_.each($meta, function(value, key, list){
  
  			if(_.contains(ids,key)) datas.push(value);
  
  		});
  
  		json = _.map(datas, function(data, index){ data.id = ids[index]; return data; });
  
  	}
  	else{
  
  		let ids = _.keys($meta);
  		let values = _.values($meta);
  
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
  
  
}



//expose
smx.Finder = SMXFinder;


})(window, window._, window.smx);