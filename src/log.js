/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var Log = (function (){
		var start = new Date;
		var LOG_LEVEL_ERROR 	= 4;
		var LOG_LEVEL_WARNING 	= 3;
		var LOG_LEVEL_INFO 		= 2;
		var LOG_LEVEL_DEBUG		= 1;
		var log_level = LOG_LEVEL_DEBUG;
		var logObject = {
			setLogLevel : function(level) {
				if (level == this.d) log_level = LOG_LEVEL_DEBUG;
				else if (level == this.i) log_level = LOG_LEVEL_INFO;
				else if (level == this.w) log_level = LOG_LEVEL_WARNING;
				else if (level == this.e) log_level = LOG_LEVEL_ERROR;
				else log_level = LOG_LEVEL_ERROR;
			},
			d : function(module, msg) {
				if (LOG_LEVEL_DEBUG >= log_level) {
					console.debug("["+Log.getDurationString(new Date-start,1000)+"]","["+module+"]",msg);
				}
			},
			i : function(module, msg) {
				if (LOG_LEVEL_INFO >= log_level) {
					console.info("["+Log.getDurationString(new Date-start,1000)+"]","["+module+"]",msg);
				}
			},
			w : function(module, msg) {
				if (LOG_LEVEL_WARNING >= log_level) {
					console.warn("["+Log.getDurationString(new Date-start,1000)+"]","["+module+"]",msg);
				}
			},
			e : function(module, msg) {
				if (LOG_LEVEL_ERROR >= log_level) {
					console.error("["+Log.getDurationString(new Date-start,1000)+"]","["+module+"]",msg);
				}
			}
		};
		return logObject;
	})();
	
/* Helper function to print a duration value in the form H:MM:SS.MS */
Log.getDurationString = function(duration, timescale) {
	var timescale = timescale || 1;
	var duration_sec = duration/timescale;
	var hours = Math.floor(duration_sec/3600);
	duration_sec -= hours * 3600;
	var minutes = Math.floor(duration_sec/60);
	duration_sec -= minutes * 60;		
	duration_sec = Math.floor(duration_sec*1000)/1000;
	return ""+hours+":"+pad(minutes,2)+":"+pad(duration_sec,2);
}
	
