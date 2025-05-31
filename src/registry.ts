import type * as MP4Box from '@types';
import type { Box, SampleGroupEntry } from '#/box';
import type { SampleEntry } from '#/boxes/sampleentries/base';

function getRegistryId(boxClass: object): symbol | undefined {
  let current = boxClass;
  while (current) {
    if ('registryId' in current) {
      return (current as unknown)['registryId'] as symbol;
    }
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

const isSampleGroupEntry = (value: object): value is SampleGroupEntry => {
  const symbol = Symbol.for('SampleGroupEntryIdentifier');
  return getRegistryId(value) === symbol;
};

const isSampleEntry = (value: object): value is SampleEntry => {
  const symbol = Symbol.for('SampleEntryIdentifier');
  return getRegistryId(value) === symbol;
};

const isBox = (value: object): value is Box => {
  const symbol = Symbol.for('BoxIdentifier');
  return getRegistryId(value) === symbol;
};

export const BoxRegistry: MP4Box.BoxRegistry = {
  uuid: {},
  sampleEntry: {},
  sampleGroupEntry: {},
  box: {},
};
export function registerBoxes(registry: Record<string, object>) {
  for (const [key, value] of Object.entries(registry)) {
    // Check if SampleGroupEntry class
    if (isSampleGroupEntry(value)) {
      const groupingType = 'grouping_type' in value ? (value.grouping_type as string) : undefined;

      if (!groupingType) {
        throw new Error(
          `SampleGroupEntry class ${key} does not have a valid static grouping_type. Please ensure it is defined correctly.`,
        );
      }

      if (groupingType in BoxRegistry.sampleGroupEntry) {
        throw new Error(
          `SampleGroupEntry class ${key} has a grouping_type that is already registered. Please ensure it is unique.`,
        );
      }

      BoxRegistry.sampleGroupEntry[groupingType] = value;
      continue;
    }

    // Check if SampleEntry class
    if (isSampleEntry(value)) {
      const fourcc = 'fourcc' in value ? (value.fourcc as string) : undefined;

      if (!fourcc) {
        throw new Error(
          `SampleEntry class ${key} does not have a valid static fourcc. Please ensure it is defined correctly.`,
        );
      }

      if (fourcc in BoxRegistry.sampleEntry) {
        throw new Error(
          `SampleEntry class ${key} has a fourcc that is already registered. Please ensure it is unique.`,
        );
      }

      BoxRegistry.sampleEntry[fourcc] = value;
      continue;
    }

    // Check if Box class
    if (isBox(value)) {
      const fourcc = 'fourcc' in value ? (value.fourcc as string) : null;
      const uuid = 'uuid' in value ? (value.uuid as string) : null;

      // Check for UUID first
      if (fourcc === 'uuid') {
        if (!uuid) {
          throw new Error(
            `Box class ${key} has a fourcc of 'uuid' but does not have a valid uuid. Please ensure it is defined correctly.`,
          );
        }

        if (uuid in BoxRegistry.uuid) {
          throw new Error(
            `Box class ${key} has a uuid that is already registered. Please ensure it is unique.`,
          );
        }

        BoxRegistry.uuid[uuid] = value;
        continue;
      }

      // This is a regular box with a fourcc
      BoxRegistry.box[fourcc] = value;
      continue;
    }

    throw new Error(
      `Box class ${key} does not have a valid static fourcc, uuid, or grouping_type. Please ensure it is defined correctly.`,
    );
  }
  return registry;
}

export const DescriptorRegistry = {} as MP4Box.DescriptorRegistry;
export function registerDescriptors<T>(registry: T) {
  Object.entries(registry).forEach(([key, value]) => (DescriptorRegistry[key] = value));
  return registry;
}
