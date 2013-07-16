/**
*   SMX Node Class
*
*   @Module Node
*
*/

(function(smx){
 

    /**
     *  UI ATTR CONTROLLER
     *  @module UIAttrController
     *  Plugin Controller for attributes namespaced with 'ui-'
     */ 

    var UIAttrController = {

        'MEDIA_TYPES': ['screen','print','tv'],

        'get': function(node,key,type){

            //resolve 'media' value
            type = this.normalizeMediaType(type);

            //get 'ui-type-key' attr
            var asset = node.attr('ui-'+ type +'-'+ key);

            //no typed key? use generic 'ui-key'
            if (_.isEmpty(asset)) asset = node.attr('ui-'+key);

            //resolve asset url
            if (!_.isEmpty(asset))
                return this.resolveURL(node,asset);           

            return;

        },


        'normalizeMediaType': function(type){

            if (_.isEmpty(type)) return this.MEDIA_TYPES[0];

            if (_.contains(this.MEDIA_TYPES,type))
                return type;
            else
                return this.MEDIA_TYPES[0];
           
        },

        'resolveURL': function(node, asset) {

            //starts with '$/' means root app
            if(asset.substr(0,2)=='$/') asset = asset.substr(2);
            //starts with './' means root document
            else if(asset.substr(0,2)=='./') asset = node.root().get('url') + asset.substr(2);
            //else is relative to node
            else asset = node.get('url') + asset;

            return asset;

        }

    };


    //expose into global smx namespace
    smx.UIAttrController = UIAttrController;



})(window.smx);