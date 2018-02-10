/**
 * Extends SMXNode with UserInterface methods
 * @mixin Node-Ui
 */

((smx)=>{

  var UiAttrController = {

      'MEDIA_TYPES': ['screen','print','tv'],

      'get': function(node,key,media_type){

          //resolve 'media' value
          media_type = this.normalizeMediaType(media_type);

          //get 'ui-type-key' attr
          var asset = node.attr('ui-'+ media_type +'-'+ key);

          //no typed key? use generic 'ui-key'
          if (_.isEmpty(asset)) asset = node.attr('ui-'+key);

          //resolve asset url
          if (!_.isEmpty(asset))
              return this.resolveURL(node,asset);

          return;

      },


      'normalizeMediaType': function(type){

          if (_.isEmpty(type)) return this.MEDIA_TYPES[0];

          if (_.includes(this.MEDIA_TYPES,type))
              return type;
          else
              return this.MEDIA_TYPES[0];
         
      },

      'resolveURL': function(node, asset) {

          //starts with '$/' means package root
          if(asset.substr(0,2)=='$/') asset = node.root().get('url') + asset.substr(2);
          //starts with './' means app root
          else if(asset.substr(0,2)=='./') asset = asset.substr(2);
          //else is relative to node
          else asset = node.get('url') + asset;

          return asset;

      }

  };


  let NodeUiInterface = {
    
    /**
     * Gets an user interface asset by key and type
     * @memberof Node/UI
     * @param {String}
     * @param {String=}
     */
    ui: function(key,type){
      
      return UiAttrController.get(this,key,type);
      
    }
    
  };


//extends smx fn methods
smx.fn = smx.fn || {};
smx.fn = Object.assign(smx.fn, NodeUiInterface);

  
})(window.smx)

