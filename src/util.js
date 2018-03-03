'use strict';

var Util = function(){};

Util.rand = function(a, b) {
	var c; if(a > b) { c = a; a = b; b = c; }
	return Math.floor(Math.random() * (b - a + 1)) + a;
}

Util.log = function(msg) {
	var cont = "[" + Util.dateTime() + " INFO] " + msg;
	console.log(cont);
}

Util.logError = function(msg) {
	var cont = "[" + Util.dateTime() + " ERROR] " + msg;
	console.log(cont);
}

Util.handleTwitError = function(err) {
	if(err.code == 327)
		return;
	var d = dateTime(); 
	console.error('Error [' + d + ']', err.code);
	console.error('> response status:', err.statusCode);
	console.error('> message:', err.message);
}

// Prepend '0' if a is less than @lt
Util.prepZero = function(a, lt) {
	if(!isNaN(a) && a < lt)
		return '0' + a.toString();
	return a.toString();
}

Util.dateTime = function() {
	var d = new Date(Date.now() + 1*60*60*1000);  //est timezone
	var date = Util.prepZero(d.getDate(), 10);
	var month = Util.prepZero(d.getUTCMonth() + 1, 10);
	var hour = Util.prepZero(d.getUTCHours(), 10);
	var minute = Util.prepZero(d.getUTCMinutes(), 10);
	var second = Util.prepZero(d.getUTCSeconds(), 10);
	return date + '/' + month + ' ' + hour + ':' + minute + ':' + second;
};

module.exports = Util;