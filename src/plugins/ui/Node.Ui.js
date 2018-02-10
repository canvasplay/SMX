/**
 * Extends SMXNode with UserInterface methods
 * @mixin Node-Ui
 */

((smx)=>{
  
  let NodeUiInterface = {
    
    /**
     * Gets an user interface asset by key and type
     * @memberof Node/UI
     * @param {String}
     * @param {String=}
     */
    ui: function(key,type){
      
      return smx.UIAttrController.get(this,key,type);
      
    }
    
  };


//extends smx fn methods
smx.fn = smx.fn || {};
smx.fn = Object.assign(smx.fn, NodeUiInterface);

  
})(window.smx)

