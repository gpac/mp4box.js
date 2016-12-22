/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var Log = (function (){
		var start = new Date();
		var LOG_LEVEL_ERROR 	= 4;
		var LOG_LEVEL_WARNING 	= 3;
		var LOG_LEVEL_INFO 		= 2;
		var LOG_LEVEL_DEBUG		= 1;
		var log_level = LOG_LEVEL_ERROR;
		var logObject = {
			setLogLevel : function(level) {
				if (level == this.debug) log_level = LOG_LEVEL_DEBUG;
				else if (level == this.info) log_level = LOG_LEVEL_INFO;
				else if (level == this.warn) log_level = LOG_LEVEL_WARNING;
				else if (level == this.error) log_level = LOG_LEVEL_ERROR;
				else log_level = LOG_LEVEL_ERROR;
			},
			debug : function(module, msg) {
				if (console.debug === undefined) {
					console.debug = console.log;
				}
				if (LOG_LEVEL_DEBUG >= log_level) {
					console.debug("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			info : function(module, msg) {
				if (LOG_LEVEL_INFO >= log_level) {
					console.info("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			warn : function(module, msg) {
				if (LOG_LEVEL_WARNING >= log_level) {
					console.warn("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			error : function(module, msg) {
				if (LOG_LEVEL_ERROR >= log_level) {
					console.error("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			}
		};
		return logObject;
	})();
	
/* Helper function to print a duration value in the form H:MM:SS.MS */
Log.getDurationString = function(duration, _timescale) {
	var neg;
	/* Helper function to print a number on a fixed number of digits */
	function pad(number, length) {
		var str = '' + number;
		var a = str.split('.');		
		while (a[0].length < length) {
			a[0] = '0' + a[0];
		}
		return a.join('.');
	}
	if (duration < 0) {
		neg = true;
		duration = -duration;
	} else {
		neg = false;	
	}
	var timescale = _timescale || 1;
	var duration_sec = duration/timescale;
	var hours = Math.floor(duration_sec/3600);
	duration_sec -= hours * 3600;
	var minutes = Math.floor(duration_sec/60);
	duration_sec -= minutes * 60;		
	var msec = duration_sec*1000;
	duration_sec = Math.floor(duration_sec);
	msec -= duration_sec*1000;
	msec = Math.floor(msec);
	return (neg ? "-": "")+hours+":"+pad(minutes,2)+":"+pad(duration_sec,2)+"."+pad(msec,3);
}
	
/* Helper function to stringify HTML5 TimeRanges objects */	
Log.printRanges = function(ranges) {
	var length = ranges.length;
	if (length > 0) {
		var str = "";
		for (var i = 0; i < length; i++) {
		  if (i > 0) str += ",";
		  str += "["+Log.getDurationString(ranges.start(i))+ ","+Log.getDurationString(ranges.end(i))+"]";
		}
		return str;
	} else {
		return "(empty)";
	}
}

if (typeof exports !== 'undefined') {
	exports.Log = Log;
}
