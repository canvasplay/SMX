/**
 * @module Ui
 * @memberof smx
 * @description
 * User Interface Module, lorem ipsum dolor sit amet consectetuer adipiscing elit aliquet amet.
 *
 * ### Reserved XML: `[ui-*]`,` :ui`.
 *
 */

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


/**
 * Extends {@link smx.Node Node} with UserInterface methods
 * @mixin Node-Ui
 * @memberof smx.module:Ui
 */
let NodeInterface = {
  
  /**
   * Gets an user interface asset by key and type
   * @memberof smx.module:Ui.Node-Ui
   * @param {String} key
   * @param {String} [type="screen"]
   * @example
   * <!-- language: lang-xml -->
   * <page ui-template="tmpl/page.html">
   *
   * <!-- language: lang-js -->
   * page.ui('template');
   * //-> "tmpl/page.html"
   *
   * //<page ui-screen-template="tmpl/page-screen.html" ui-print-template="tmpl/page-print.html">
   * page.ui('template','print');
   * //-> "tmpl/page-print.html"
   * page.ui('template','screen');
   * //-> "tmpl/page-screen.html"
   * page.ui('template');
   * //-> "tmpl/page-screen.html"
   *
   */
  ui: function(key,type){
    
    return UiAttrController.get(this,key,type);
    
  }
  
};

export default {
  Node: NodeInterface
};