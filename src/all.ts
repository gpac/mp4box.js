export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/DataStream';
export * from '#/descriptor';
export * from '#/isofile';
export * from '#/log';
export * from '#/stream';
export * from '#/text-mp4';

import { registerBox, registerUUID } from '#/box-registry';
import { UUIDBoxes } from '#/boxes/uuid';
import * as ALL_BOXES from './all-boxes';

Object.entries(ALL_BOXES).forEach(([key, instance]) => {
  registerBox(key, instance);
});

Object.entries(UUIDBoxes).forEach(([key, instance]) => {
  registerUUID(key, instance);
});

export type AllBoxes = typeof ALL_BOXES;
