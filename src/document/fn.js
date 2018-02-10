(function(global, Sizzle, smx){

/**
 * Placeholder namespace to contain Node extensions
 * @namespace fn
 * @memberof smx
 */

var fn = {};



//extends smx fn methods
smx.fn = (!smx.fn) ? fn : Object.assign(smx.fn, fn);

})(window, window.Sizzle, window.smx);
