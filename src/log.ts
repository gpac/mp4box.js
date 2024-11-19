// @ts-nocheck

/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
const start = new Date();

const LOG_LEVEL_ERROR = 4;
const LOG_LEVEL_WARNING = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_DEBUG = 1;

let log_level = LOG_LEVEL_ERROR;

export class Log {
  static setLogLevel(level: unknown) {
    if (level == this.debug) log_level = LOG_LEVEL_DEBUG;
    else if (level == this.info) log_level = LOG_LEVEL_INFO;
    else if (level == this.warn) log_level = LOG_LEVEL_WARNING;
    else if (level == this.error) log_level = LOG_LEVEL_ERROR;
    else log_level = LOG_LEVEL_ERROR;
  }
  static debug(module: string, msg?: unknown) {
    if (console.debug === undefined) {
      console.debug = console.log;
    }
    if (LOG_LEVEL_DEBUG >= log_level) {
      console.debug(
        '[' + Log.getDurationString(new Date() - start, 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  }
  static log(module: { msg: unknown }, msg?: unknown) {
    this.debug(module.msg);
  }
  static info(module: string, msg?: unknown) {
    if (LOG_LEVEL_INFO >= log_level) {
      console.info(
        '[' + Log.getDurationString(new Date() - start, 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  }
  static warn(module: string, msg?: unknown) {
    if (LOG_LEVEL_WARNING >= log_level) {
      console.warn(
        '[' + Log.getDurationString(new Date() - start, 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  }
  static error(module: string, msg?: unknown) {
    if (LOG_LEVEL_ERROR >= log_level) {
      console.error(
        '[' + Log.getDurationString(new Date() - start, 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  }
  /* Helper function to print a duration value in the form H:MM:SS.MS */
  static getDurationString(duration: number, _timescale?: number) {
    var neg: boolean;
    /* Helper function to print a number on a fixed number of digits */
    function pad(number: string | number, length: number) {
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
  static printRanges(ranges: {
    length: unknown;
    start: (arg0: number) => any;
    end: (arg0: number) => any;
  }) {
    var length = ranges.length;
    if (length > 0) {
      var str = '';
      for (var i = 0; i < length; i++) {
        if (i > 0) str += ',';
        str +=
          '[' +
          Log.getDurationString(ranges.start(i)) +
          ',' +
          Log.getDurationString(ranges.end(i)) +
          ']';
      }
      return str;
    } else {
      return '(empty)';
    }
  }
}
