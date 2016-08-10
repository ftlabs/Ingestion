(function(){

	'use strict';

	function prevent(e){e.preventDefault();};
	function stopPropagation(e){e.stopImmediatePropagation();}

	var form = document.querySelector('#signup-form');

	if(form !== null){

		/*form.addEventListener('submit', function(e){
			prevent(e);
			stopPropagation(e);
			
			console.log(this);
			var oReq = new XMLHttpRequest();
			oReq.onload = function(e){
				console.log("Request success:", e);
			};
			oReq.open("POST", this.action);
			console.log(new FormData(this));
			oReq.send(new FormData(this));

		}, false);*/

	}

}());