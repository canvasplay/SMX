/**
 * Block Content Node Class
 * 
 */

SMX.document.Block = new JS.Class(SMX.document.PlayNode,{

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'BLOCK';
		
	},
	

	play : function(_index){
		var i;
		
		if(!_index){
		//no index: plays 0
			i = 0;
		}
		else if(_index instanceof Array){
		//index is and array: extract first index form array
			i = _index.shift();
		}
		else{
		//else: try index as int
			i = parseInt(_index);
		}
		
		if (this.childs[i]) return this.childs[i].play(_index);
		else return false;
		
		return this.callSuper();
		
	}
	
});
