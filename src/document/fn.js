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



////////////////////////////////
// TIME INTERFACE
// 'time' attributes namespace
// definend in smx/document/TimeAttrController.js

/**
 * Time Interface Methods
 * @module Node/Time
 */
fn.TimeInterface = {


    /**
    *   @method time
    */
    time: function(key){

        return smx.TimeAttrController.get(this,key);
    },


    /**
    *   @method synchronize
    */
    synchronize: function(){

        /*
        //get 'timing' attribute value
        var is_timed = this.time('timed');
        var is_timeline = this.time('timeline');

        //check if node need to be sync
        if (!is_timed && !is_timeline){

            this.duration=0;
            this.start=0;

            //do not use 'sync' attribute so flag it with 'is-sync'
            this[0].setAttribute('is-sync','true');

            return;
        }
        */


        //update sync values (start, duration)
        var force_sync = true;
        var duration = this.time('duration',force_sync);
        var start = this.time('start',force_sync);

        return;
    }


};



//extends smx fn methods
smx.fn = (!smx.fn) ? fn : Object.assign(smx.fn, fn);

})(window, window.Sizzle, window.smx);
