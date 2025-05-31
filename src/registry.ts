import type * as MP4Box from '@types';

export const BoxRegistry = {} as MP4Box.BoxRegistry;
export function registerBoxes<T>(registry: T) {
  for (const [key, value] of Object.entries(registry)) {
    if (value.fourcc && value.fourcc !== 'uuid') {
      BoxRegistry[value.fourcc] = value;
    } else if (value.fourcc === 'uuid' && value.uuid) {
      BoxRegistry[value.uuid] = value;
    } else {
      throw new Error(
        `Box ${key} does not have a valid fourcc or uuid. Please ensure it is defined correctly.`,
      );
    }
  }
  return registry;
}

export const DescriptorRegistry = {} as MP4Box.DescriptorRegistry;
export function registerDescriptors<T>(registry: T) {
  Object.entries(registry).forEach(([key, value]) => (DescriptorRegistry[key] = value));
  return registry;
}
