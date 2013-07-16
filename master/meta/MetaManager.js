

(function(smx){


	var MetaManager = function(document){

		//requires document to be instantiated
		if(!document) return;

		//extend this with backbone events funcionality
		_.extend(this, Backbone.Events);

		//set source document
		this.document = document;

		//creates an empty collection to handle document metadatas
		this.collection = new Backbone.Collection();

		//initialize document
		this.initializeDocument();

		//return just created object
		return this;

	};


	MetaManager.prototype.initializeDocument = function(){

		//add document itself as metadata
		this.addFromNode(this.document);

		var nodes = this.document.find('*');
		for (var i=0; i< nodes.length; i++){
			var node = nodes[i];
			this.addFromNode(node);
		}

		return this;

	};

	MetaManager.prototype.addFromNode = function(node){

		var attrs = node[0].attributes;
		var meta_attrs = {};

		for(var i = 0; i < attrs.length; i++) {
			var attr_name = attrs[i].name;
			var attr_value = attrs[i].value;
			if(attr_name.indexOf("meta-") == 0){
				attr_name = attr_name.substr(5);
				meta_attrs[attr_name] = attr_value;
			}
				
		}

		var meta = new Backbone.Model(_.extend({ 'id': node.id},meta_attrs));
		this.collection.add(meta);

		return meta;			

	};

	MetaManager.prototype.get = function(id, key){

		if (!id || !key) return;

		var meta = this.collection.get(id);

		if (!meta) 	return;
		else		return meta.get(key);

	};

	MetaManager.prototype.set = function(id, key, value){

		if (!id || !key || !value) return;

		var meta = this.collection.get(id);

		if (!meta) return;
		else		return meta.set(key,value);

	};


	//return MetaManager;
	//expose

	smx.meta.MetaManager = MetaManager;



})(window.smx);
