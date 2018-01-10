(function(global, _, Sizzle, smx){



const ComputedAttributes = {

    /**
     *  @method index
     *  position in parent children
     */

    test: function(){

      //this === node

    }


};


//extend SMXNode with computed attribute functions as getters
_.each(ComputedAttributes, function(fn,key){
  Object.defineProperty(smx.Node.prototype, key, { get: fn });
});


})(window, window._, window.Sizzle, window.smx);
