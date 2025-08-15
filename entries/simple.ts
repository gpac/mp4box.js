export * from '#/box';
export * from '#/buffer';
export * from '#/create-file';
export * from '#/isofile';
export * from '#/log';
export * from './types';
import { registerBoxes } from '#/registry';
import * as SIMPLE_BOXES from './simple-boxes';

export const BoxParser = registerBoxes(SIMPLE_BOXES);
