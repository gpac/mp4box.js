/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

const LOG_LEVEL_ERROR = 4;
const LOG_LEVEL_WARNING = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_DEBUG = 1;

export class _Log {
  start: Date;
  log_level: number;

  constructor(log_level?: number) {
    this.start = new Date();
    this.log_level = log_level || LOG_LEVEL_ERROR;
  }

  setLogLevel(level: (...args: unknown[]) => void) {
    if (level == this.debug) this.log_level = LOG_LEVEL_DEBUG;
    else if (level == this.info) this.log_level = LOG_LEVEL_INFO;
    else if (level == this.warn) this.log_level = LOG_LEVEL_WARNING;
    else if (level == this.error) this.log_level = LOG_LEVEL_ERROR;
    else this.log_level = LOG_LEVEL_ERROR;
  }

  debug(module?: string, msg?: string) {
    if (console.debug === undefined) {
      console.debug = console.log;
    }
    if (LOG_LEVEL_DEBUG >= this.log_level) {
      console.debug(
        '[' + this.getDurationString(+new Date() - +this.start, 1000) + ']',
        '[' + module + ']',
        msg
      );
    }
  }

  log(module?: string, msg?: string) {
    this.debug(module, msg);
  }

  info(module?: string, msg?: string) {
    if (LOG_LEVEL_INFO >= this.log_level) {
      console.info(
        '[' + this.getDurationString(+new Date() - +this.start, 1000) + ']',
        '[' + module + ']',
        msg
      );
    }
  }
  warn(module?: string, msg?: string) {
    if (LOG_LEVEL_WARNING >= this.log_level) {
      console.warn(
        '[' + this.getDurationString(+new Date() - +this.start, 1000) + ']',
        '[' + module + ']',
        msg
      );
    }
  }
  error(module?: string, msg?: string) {
    if (LOG_LEVEL_ERROR >= this.log_level) {
      console.error(
        '[' + this.getDurationString(+new Date() - +this.start, 1000) + ']',
        '[' + module + ']',
        msg
      );
    }
  }

  /* Helper function to print a duration value in the form H:MM:SS.MS */
  getDurationString(duration: number, _timescale?: number) {
    var neg;
    /* Helper function to print a number on a fixed number of digits */
    function pad(number: number, length: number) {
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
    var duration_sec = duration / timescale;
    var hours = Math.floor(duration_sec / 3600);
    duration_sec -= hours * 3600;
    var minutes = Math.floor(duration_sec / 60);
    duration_sec -= minutes * 60;
    var msec = duration_sec * 1000;
    duration_sec = Math.floor(duration_sec);
    msec -= duration_sec * 1000;
    msec = Math.floor(msec);
    return (
      (neg ? '-' : '') +
      hours +
      ':' +
      pad(minutes, 2) +
      ':' +
      pad(duration_sec, 2) +
      '.' +
      pad(msec, 3)
    );
  }

  /* Helper function to stringify HTML5 TimeRanges objects */
  printRanges(ranges: TimeRanges) {
    var length = ranges.length;
    if (length > 0) {
      var str = '';
      for (var i = 0; i < length; i++) {
        if (i > 0) str += ',';
        str +=
          '[' +
          this.getDurationString(ranges.start(i)) +
          ',' +
          this.getDurationString(ranges.end(i)) +
          ']';
      }
      return str;
    } else {
      return '(empty)';
    }
  }
}

export const Log = new _Log();
