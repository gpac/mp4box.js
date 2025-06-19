export * from '#/box';
export * from '#/box-diff';
export * from '#/boxes/sampleentries/base';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/DataStream';
export * from '#/descriptor';
export * from '#/isofile';
export * from '#/log';
export * from '#/mp4boxbuffer';
export * from '#/stream';
export * from '#/text-mp4';
export * from './types';
import * as DESCRIPTORS from '#/descriptor';
import { registerBoxes, registerDescriptors } from '#/registry';

import * as BOXES from './all-boxes';
export { BOXES };
export * from '#/boxes/sampleentries';

export const BoxParser = registerBoxes(BOXES);

registerDescriptors(DESCRIPTORS);
