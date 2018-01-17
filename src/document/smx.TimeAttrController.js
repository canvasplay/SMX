(function(smx){
 


    /**
     *  TIME ATTR CONTROLLER
     *  Plugin Controller for attributes namespace with 'ui'
     *  @module TimeAttrController
     */



    var TimeAttrController = {


        'getters': {

            'timeline': function(node){
                return (node.attr('timeline')==='true');
            },

            'timed': function(node){

                var is_in_timeline = false;
                var is_timeline = this.timeline(node);

                if(is_timeline) return false;
                else{
                    var parent = node.parent();
                    while(parent && !this.timeline(parent)){
                        parent = parent.parent();
                    }

                    if(!parent) return false;
                    else if(this.timeline(parent)) return true;
                    else return false;
                }

            },

            'timing': function(node){
                return (node.attr('timing')==='absolute')? 'absolute': 'relative';
            },

            'duration': function(node, force_sync){

               //use local value if already exists...
                if (!force_sync && _.isNumber(node.duration)) return node.duration;

                //has duration attribute?
                var duration = parseInt(node.attr('duration'));
                if(_.isNaN(duration) || duration<0) duration = NaN;

                //sync start for
                var start = this.start(node);

                //try child summatory
                if (_.isNaN(duration)){
                    var childs = node.children();
                    childs = childs.reverse();
                    if(childs.length>0){
                        // childs will define duration using
                        // the child with the highest offset+duration value
                        var max = 0;
                        for(var n=0; n<childs.length;n++){
                            var child = childs[n];
                            var sum = this.offset(child) + this.duration(child,force_sync);
                            if(sum>max) max = sum;
                        }
                        duration = max;
                    }
                    else if(!node.next() && !node.previous()){
                        duration = 0;
                    }
                }

                
                //check next sibling dependencies
                if (_.isNaN(duration) && this.timed(node)){

                    //get parent
                    var parent = node.parent();

                    if(parent && _.isNumber(parent.duration)){

                        //get next sibling with absolute timing
                        var next = node.next();
                        var target = null;
                        while(next && !target){
                            if(this.timing(next) == 'absolute') target = next;
                            else                                next = next.next();
                        }

                        if(target){
                            if (_.isNumber(target.start) && _.isNumber(node.start)){
                                duration = parseInt(this.offset(next)-node.start);
                                if(_.isNaN(duration) || duration<0) duration=NaN;
                            }
                        }
                        else{
                            duration = parseInt(this.duration(parent)-node.start);
                            if(_.isNaN(duration) || duration<0) duration=NaN;
                        }
                    }
                    else{
                        duration = NaN;
                    }

                }

                if (_.isNaN(duration) && !this.timed(node)){
                    duration = 0;
                }

                //could not determine duration? set to 0
                if(_.isNaN(duration)){
                    duration = 0;
                }
                else{
                    //create sync flag attribute
                    node[0].setAttribute('is-sync','true');
                }

                //set local value
                node.duration = duration;

                //return local value
                return node.duration;


            },

            'start': function(node, force_sync){

                var start;

                //bool flag use or not local value if exists
                if (!force_sync){

                    //has local value?
                    start = node.attr('start');
                    if(_.isNumber(start)) return start;

                }

                //get it from attribute
                start = parseInt(node.attr('start'));
                if(_.isNaN(start) || start<0) start = 0;

                //set local value
                node.start = start;

                //return local value
                return start;

            },

            'offset': function(node, from){

                var offset = 0;
                var timing = this.timing(node);

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