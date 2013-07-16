(function(smx){
 


    /**
     *  TIME ATTR CONTROLLER
     *  @module TimeAttrController
     *  Plugin Controller for attributes namespace with 'ui'
     */ 



    var TimeAttrController = {


        'getters': {

            'timeline': function(node){
                return (node.attr('timeline')==='true');
            },

            'timing': function(node){
                return (node.attr('timing')==='absolute')? 'absolute': 'relative';
            },

            'duration': function(node){
                return node.attr('duration');
            },

            'start': function(node){

                var start, force_sync;

                //bool flag use or not local value if exists
                if (!force_sync){

                    //has local value?                    
                    start = node.attr('start');
                    if(_.isNumber(start)) return start;

                }

                //get it from attribute
                start = parseInt(node.raw('start'));
                if(_.isNaN(start) || start<0) start = 0;

                //set local value
                this.start = start;

                //return local value
                return start;

            },

            'offset': function(node){

                var offset = 0;
                var timing = this.timing(node);
                var from;

                var start = this.start(node);
               
                if(timing == 'absolute'){
                //absolute timing
                //depends on parent node

                    offset = start;

                }else{
                //relative timing
                //depends on previous sibling node

                    var prev = node.previous();

                    if(prev)    offset = this.offset(prev) + this.duration(prev) + start;
                    else        offset = start;
                   
                }

                if (!from) return offset;

                if(!from.isParentOf(node)) offset = -1;
                else{

                    var parent = node.parent();
                    if(!parent) offset = -1;
                    /////????????????????????????
                    else if(parent!=from) offset = this.offset(parent,from) + offset;
               
                }
 
                return offset;

            },

            'end': function(node){
               return this.start(node) + this.duration(node);
            }

        },


        'get': function(node,key){

            if (_.isFunction(this.getters[key])){
                return this.getters[key](node);
            }
            else
                return;

        }



    };





    //expose into global smx namespace
    smx.TimeAttrController = TimeAttrController;



})(window.smx);