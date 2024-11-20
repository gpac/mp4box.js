export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/isofile';
export * from '#/log';
export * from '#/stream';

import { registerBox } from '#/box-registry';
import * as SIMPLE_BOXES from './simple-boxes';

Object.entries(SIMPLE_BOXES).forEach(([key, instance]) => {
  registerBox(key, instance);
});

export type SimpleBoxes = typeof SIMPLE_BOXES;
