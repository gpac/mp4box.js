import { AllCodecs } from './all';

export const CODECS = {} as AllCodecs;
export function register(name: string, box: new (...args: unknown[]) => unknown) {
  CODECS[name] = box;
  return box;
}
