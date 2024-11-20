export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/DataStream';
export * from '#/isofile';
export * from '#/log';
export * from '#/stream';
export * from '#/text-mp4';
import * as ALL_DESCRIPTORS from '#/descriptor';

import { UUIDBoxes } from '#/boxes/uuid';
import { registerBox, registerDescriptor, registerSampleGroup, registerUUID } from '#/registry';
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

Object.entries(ALL_DESCRIPTORS).forEach(([key, descriptor]) => {
  registerDescriptor(key, descriptor);
});

export type AllBoxes = (typeof ALL_BOXES)[keyof typeof ALL_BOXES];
