(function (global, smx) {


    /**
     * SMX Document Class
     * @extends smx.Node
     * @memberof smx
     */
    class Document extends smx.Node {

        /**
         * @param {XMLNode} xmlNode
         */
        constructor(xmlNode) {
            super(xmlNode);
            
            /**
             * playhead controller
             * @type {Playhead}
             */
            //this.playhead = new smx.Playhead(this);
            
            /**
             * tracking controller
             * @type {Tracking}
             */
            //this.tracking = new smx.Tracking(this);
            
        }
        
    }

    //expose
    smx.Document = Document;



})(window, window.smx);