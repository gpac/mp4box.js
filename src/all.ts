export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/DataStream';
export * from '#/descriptor';
export * from '#/isofile';
export * from '#/log';
export * from '#/stream';
export * from '#/text-mp4';

import * as ALL_CODECS from '#/codecs-all';
import { register } from './registry';

Object.entries(ALL_CODECS).forEach(([key, instance]) => {
  register(key, instance);
});

export type AllCodecs = typeof ALL_CODECS;
