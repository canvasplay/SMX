(function(global, _, smx){



let methods = {

  /**
  *   @method isAccesible
  */
  isAccesible: function(){

      if(global.app.config.FREE_ACCESS) return true;

      var is_accesible = true;
      var value = this.track('access','raw');

      //check node
      if(_.isUndefined(value) || value == 'none'){}
      else{
          value = parseInt(value);
          if(_.isNumber(value) && value!=0) is_accesible = false;
      }


      //still accesible... check ancestors!
      if(is_accesible){
          var parent = this.parent();
          if(parent) is_accesible = parent.isAccesible();
      }

      return is_accesible;

  },


  /**
  *   @method track
  */
  track: function(key, format){

      //if exists ($tracking) TrackManager use it
      if($tracking) return $tracking.get(this.id,key,format);

      //else look for key in attributes
      var attrs = this[0].attributes;
      var value = null;
      for(var i = 0; i < attrs.length; i++) {
          var attr_name = attrs[i].name+'';
          var attr_value = attrs[i].name+'';
          if(attr_name.indexOf("track-") == 0){
              attr_name = attr_name.substr(6);
              if(attr_name == key) value = attrs[i].value;
          }
          if(value) i = attrs.length;
      }

      return value;

  },

  /**
  *   Returns true if this node uses tracking attributes
  *   @method isTracking
  *   @param {String} (optional) key
  *   @return {Boolean} result
  */
  isTracking: function(key){

      if(!key){

          //check for root track attr
          var value = this[0].getAttribute('track');

          if(value=='none') return false;

          return true;

      }
      else{
      //check for given key track attr

          //get track-key attr value from xml source node
          var value = this.attr('track-'+ key);

          if (_.isUndefined(value) || _.isNull(value) || value=='none')
              return false;

          return true;


      }

      return;

  },


  /**
  *   @method     update
  *   @desc       shortcut of TrackManager.update from given node
  */
  update: function(key){

      //this method requires TrackManager
      if(!$tracking) return;

      $tracking.update(this.id,key);

      return;

  },


  /**
  *   @method track
  *   @desc       shortcut of TrackManager.propagate from given node
  */
  propagate: function(key, recursive){

      //this method requires TrackManager
      if(!$tracking) return;

      $tracking.propagate(this.id,key,recursive);

      return;
  }


};



//expose to global
smx.fn = _.extend(smx.fn,{ TrackingInterface: methods });



})(window, window._, window.smx);
