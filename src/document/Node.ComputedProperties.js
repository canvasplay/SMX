(function(global, _, Sizzle, smx){



var ComputedAttributes = {

    /**
     *  @method uri
     *  Uniform Resource Identifier,"url id"
     *  Calculate url hash path using cummulative ids up to root
     */

    'uri' : function(){

        var hash = this.id + '/';
        var parent = this.parent();
        if (parent) return parent.uri + hash;
        else        return hash;

    },


    /**
     *  @method url
     *  Uniform Resource Locator (url path)
     *  Calculate url folder path using cummulative paths up to root
     */

    'url': function(){

        let path = this.attr('path');

        let parent = this.parent();

        if (parent){
            if(_.isEmpty(path))
                return parent.url;
            else{

                //add trail slash
                let trail = path.substr(-1);
                if (trail != '/') path += '/';

                return parent.url + path;
            }

        }
        else{

            if(_.isEmpty(path)) return;

            //add trail slash
            let trail = path.substr(-1);
            if (trail != '/') path += '/';

            return path;

        }

    },

    /**
     *  @method file
     *  url of xml source file of this node
     */

    'file': function(node){

      let url = '';
      let file = this.attr('file');
      let parent = this.parent();
      
      if (_.isEmpty(file))
        return (parent)? parent.file : undefined;
        
      else
        return this.url + file;
          
    },

    /**
     *  @method index
     *  position in parent children
     */

    'index': function(node, selector){

        //0 by default
        var index = 0;

        //get parent node
        var parent = this.parent();

        //no parent? its kind of root so it has no sibling nodes
        if(!parent) return index;

        //get sibling nodes
        var siblings = parent.children();

        //filter siblings collection with a css selector if its defined
        if(selector) siblings = _.filter(siblings, function(s){ return Sizzle.matchesSelector(s[0],selector) });

        //get position in siblings collection
        index = siblings.indexOf(node);

        return index;

    },

    /**
     *  @method link
     *  calculates browser url
     */

    'link': function(node, suffix){

        return (suffix||'#!/') + this.uri;

    },

    /**
     *  @method type
     *  return smx node type with 'smx' as default
     */

    'type': function(node){

        return node[0].getAttribute('type') || 'smx';

    },

    /**
     *  @method classes
     *  return class attribute as array of
     */

    'className': function(node){

        return this.attr('class');

    }


};


//extend SMXNode with computed attribute functions as getters
_.each(ComputedAttributes, function(fn,key){
  Object.defineProperty(smx.Node.prototype, key, { get: fn });
});


})(window, window._, window.Sizzle, window.smx);
