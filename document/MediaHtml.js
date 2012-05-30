/**
 * Media Content Element Class
 * 
 */

SMX.document.MediaHtml = new JS.Class(SMX.document.Media,{

	initialize: function(){
	
		this.callSuper();
		
		this.nodeName = 'HTML';
		
		this.sync_behavior = null;
		
		this.sync_status = null;
		
		//HTML source file
		this.src = '';
		
		//reference to DOM Element
		this.el = null;
		
	}
	
	
});


