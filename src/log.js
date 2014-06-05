/*
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * This notice must stay in all subsequent versions of this code.
 */
var Log = (function (){
		var LOG_LEVEL_ERROR 	= 4;
		var LOG_LEVEL_WARNING 	= 3;
		var LOG_LEVEL_INFO 		= 2;
		var LOG_LEVEL_DEBUG		= 1;
		var log_level = LOG_LEVEL_INFO;
		var log = function(level, module, msg) {
			if (level >= log_level) {
				console.log("["+module+"] "+msg);
			}
		};
		var logObject = {
			setLogLevel : function(level) {
				if (level == this.d) log_level = LOG_LEVEL_DEBUG;
				else if (level == this.i) log_level = LOG_LEVEL_INFO;
				else if (level == this.w) log_level = LOG_LEVEL_WARNING;
				else if (level == this.e) log_level = LOG_LEVEL_ERROR;
				else log_level = LOG_LEVEL_ERROR;
			},
			d : function(module, msg) {
				log(LOG_LEVEL_DEBUG, module, msg);
			},
			i : function(module, msg) {
				log(LOG_LEVEL_INFO, module, msg);
			},
			w : function(module, msg) {
				log(LOG_LEVEL_WARNING, module, LOG_LEVEL_WARNING+": "+ msg);
			},
			e : function(module, msg) {
				log(LOG_LEVEL_ERROR, module, LOG_LEVEL_ERROR+":" + msg);
			}
		};
		return logObject;
	})();