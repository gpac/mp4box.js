import { Box, SampleGroupEntry, UUIDBox } from '#/box';

type Constructor<T> = new (...args: unknown[]) => T;
type Registry<T> = Record<string, Constructor<T>>;

export const BoxRegistry = {} as Registry<Box>;
export function registerBox(name: string, box: Constructor<Box>) {
  BoxRegistry[name] = box;
}

export const SampleGroupRegistry = {} as Registry<SampleGroupEntry>;
export function registerSampleGroup(name: string, box: Constructor<SampleGroupEntry>) {
  SampleGroupRegistry[name] = box;
}

export const UUIDRegistry = {} as Registry<UUIDBox>;
export function registerUUID(name: string, box: Constructor<UUIDBox>) {
  UUIDRegistry[name] = box;
}
