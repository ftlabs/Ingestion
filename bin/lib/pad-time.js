function zero(f){
	if(f < 10){
		return `0${f}`;
	}
	return f;
}
module.exports = function(t){


  var a = {};

  a.getSeconds = () => { return zero(t.getSeconds()); };
  a.getMinutes = () => { return zero(t.getMinutes()); };
  a.getHours = () => { return zero(t.getHours()); };

  a.getDate = () => { return zero(t.getDate()); };
  a.getMonth = () => { return zero(t.getMonth()); };
  a.getFullYear = () => { return zero(t.getFullYear()); };

  return a;

}