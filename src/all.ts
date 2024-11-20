export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/DataStream';
export * from '#/descriptor';
export * from '#/isofile';
export * from '#/log';
export * from '#/stream';
export * from '#/text-mp4';

import { registerBox, registerSampleGroup, registerUUID } from '#/box-registry';
import { UUIDBoxes } from '#/boxes/uuid';
import * as ALL_BOXES from './all-boxes';
import * as ALL_SAMPLE_GROUPS from './all-sample-groups';

Object.entries(ALL_BOXES).forEach(([key, box]) => {
  registerBox(key, box);
});

Object.entries(UUIDBoxes).forEach(([key, UUIDBox]) => {
  registerUUID(key, UUIDBox);
});

Object.entries(ALL_SAMPLE_GROUPS).forEach(([key, sampleGroup]) => {
  registerSampleGroup(key, sampleGroup);
});

export type AllBoxes = (typeof ALL_BOXES)[keyof typeof ALL_BOXES];
