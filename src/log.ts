import type { ISOFile } from './isofile';

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

export const Log = {
  setLogLevel(level: (module: string, msg?: string) => void) {
    if (level === this.debug) log_level = LOG_LEVEL_DEBUG;
    else if (level === this.info) log_level = LOG_LEVEL_INFO;
    else if (level === this.warn) log_level = LOG_LEVEL_WARNING;
    else if (level === this.error) log_level = LOG_LEVEL_ERROR;
    else log_level = LOG_LEVEL_ERROR;
  },
  debug(module: string, msg?: string) {
    if (console.debug === undefined) {
      console.debug = console.log;
    }
    if (LOG_LEVEL_DEBUG >= log_level) {
      console.debug(
        '[' + Log.getDurationString(new Date().getTime() - start.getTime(), 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  },
  log(module: { msg: string }, _msg?: string) {
    this.debug(module.msg);
  },
  info(module: string, msg?: string) {
    if (LOG_LEVEL_INFO >= log_level) {
      console.info(
        '[' + Log.getDurationString(new Date().getTime() - start.getTime(), 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  },
  warn(module: string, msg?: string) {
    if (LOG_LEVEL_WARNING >= log_level) {
      console.warn(
        '[' + Log.getDurationString(new Date().getTime() - start.getTime(), 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  },
  error(module: string, msg?: string, isofile?: ISOFile) {
    if (isofile?.onError) {
      isofile.onError(module, msg);
    } else if (LOG_LEVEL_ERROR >= log_level) {
      console.error(
        '[' + Log.getDurationString(new Date().getTime() - start.getTime(), 1000) + ']',
        '[' + module + ']',
        msg,
      );
    }
  },
  /* Helper function to print a duration value in the form H:MM:SS.MS */
  getDurationString(duration: number, _timescale?: number) {
    let neg: boolean;
    /* Helper function to print a number on a fixed number of digits */
    function pad(number: string | number, length: number) {
      const str = '' + number;
      const a = str.split('.');
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
    const timescale = _timescale || 1;
    let duration_sec = duration / timescale;
    const hours = Math.floor(duration_sec / 3600);
    duration_sec -= hours * 3600;
    const minutes = Math.floor(duration_sec / 60);
    duration_sec -= minutes * 60;
    let msec = duration_sec * 1000;
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
  },
  /* Helper function to stringify HTML5 TimeRanges objects */
  printRanges(ranges: {
    length: number;
    start: (index: number) => number;
    end: (index: number) => number;
  }) {
    const length = ranges.length;
    if (length > 0) {
      let str = '';
      for (let i = 0; i < length; i++) {
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
  },
};
