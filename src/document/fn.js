(function(global, Sizzle, smx){

/**
 * Placeholder namespace to contain Node extensions
 * @namespace fn
 * @memberof smx
 */

var fn = {};





////////////////////////////////
// UI ATTRIBUTES INTERFACE
// shortcut for UIAttrController.get
// definend in smx/document/UIAttrController.js

/**
 * UserInterface Methods
 * @module Node/UI
 */


fn.UIAttrInterface = {

    /**
    *   @method ui
    */
    ui: function(key,type){

        return smx.UIAttrController.get(this,key,type);

    }


};


//extends smx fn methods
smx.fn = (!smx.fn) ? fn : Object.assign(smx.fn, fn);

})(window, window.Sizzle, window.smx);
