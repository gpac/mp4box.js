import { Box, SampleGroupEntry, UUIDBox } from '#/box';
import * as DESCRIPTORS from '#/descriptor';
import type { DescriptorKind } from './types';

type Constructor<T> = new (...args: Array<unknown>) => T;
type Registry<T> = Record<string, Constructor<T>>;
type RegistryFn<T> = (name: string, value: Constructor<T>) => void;

export const BoxRegistry = {} as Registry<Box>;
export const registerBox: RegistryFn<Box> = (name, box) => {
  BoxRegistry[name] = box;
};

// NEEDS REVIEW:  Does splitting up the api into different registries break code?
//                Are you supposed to be able to create SampleGroupEntry-instances with structs?
export const SampleGroupRegistry = {} as Registry<SampleGroupEntry>;
export const registerSampleGroup: RegistryFn<SampleGroupEntry> = (name, box) => {
  SampleGroupRegistry[name] = box;
};

// NEEDS REVIEW:  Does splitting up the api into different registries break code?
//                Are you supposed to be able to create SampleGroupEntry-instances with structs?
export const UUIDRegistry = {} as Registry<UUIDBox>;
export const registerUUID: RegistryFn<UUIDBox> = (name, box) => {
  UUIDRegistry[name] = box;
};

export const DescriptorRegistry: Partial<typeof DESCRIPTORS> = {};
export const registerDescriptor: RegistryFn<DescriptorKind> = (name, box) => {
  DescriptorRegistry[name] = box;
};
