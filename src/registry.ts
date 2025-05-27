import type * as MP4Box from '@types';

export const BoxRegistry = {} as MP4Box.BoxRegistry;
export function registerBoxes<T>(registry: T) {
  Object.entries(registry).forEach(([key, value]) => (BoxRegistry[key] = value));
  return registry;
}

export const DescriptorRegistry = {} as MP4Box.DescriptorRegistry;
export function registerDescriptors<T>(registry: T) {
  Object.entries(registry).forEach(([key, value]) => (DescriptorRegistry[key] = value));
  return registry;
}
