import type { AllBoxes } from '../all';
import type { UUIDBoxes } from './boxes/uuid';

export const BoxRegistry = {} as AllBoxes;
export const UUIDRegistry = {} as typeof UUIDBoxes;

export function registerBox(name: string, box: new (...args: unknown[]) => unknown) {
  BoxRegistry[name] = box;
  return box;
}

export function registerUUID(name: string, box: new (...args: unknown[]) => unknown) {
  UUIDRegistry[name] = box;
  return box;
}
