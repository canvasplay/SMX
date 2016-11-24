
////////////////////////////////
// META INTERFACE
// 'meta' attributes namespace


(function(global){
 

    var smx = global.smx;


    //smx is required!
    if(!smx) return;


    if(!smx.fn) smx.fn = {};
    

    smx.fn.MetaInterface = {
        
                    
        /**
        *   @method meta
        */
        meta: function(key, lang){

            var value;

            try{

                value = $meta[this.id][key];

            }
            catch(e){}

            return value;
            
        },


        /**
        *   @method interpolate
        */
        interpolate: function(key, lang){

            var str = this.meta(key, lang);

            if(!_.isString(str)) return;

            var settings = { interpolate: /\{\{(.+?)\}\}/g };

            var result;

            try{
                result = _.template(str, this, settings);
            }
            catch(e){}

            return result;


        }  

    };




})(window);