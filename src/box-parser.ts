import {
  Box,
  ContainerBox,
  FullBox,
  SampleEntry,
  SampleGroupEntry,
  SingleItemTypeReferenceBox,
  SingleItemTypeReferenceBoxLarge,
  TrackGroupTypeBox,
  TrackReferenceTypeBox,
  UUIDBox,
} from '#/box';
import * as codecsAll from './codecs-all';

export const BoxParser = {
  // Boxes effectively created
  boxCodes: Box.codes,
  fullBoxCodes: FullBox.codes,
  containerBoxCodes: ContainerBox.codes,
  sampleEntryCodes: SampleEntry.codes,
  sampleGroupEntryCodes: SampleGroupEntry.codes,
  trackGroupTypes: TrackGroupTypeBox.codes,
  UUIDs: UUIDBox.codes,

  Box,
  FullBox,
  ContainerBox,
  SampleEntry,
  SampleGroupEntry,
  TrackGroupTypeBox,

  /** @bundle parsing/singleitemtypereference.js */
  SingleItemTypeReferenceBox,
  /** @bundle parsing/singleitemtypereferencelarge.js */
  SingleItemTypeReferenceBoxLarge,
  /** @bundle parsing/TrakReference.js */
  TrackReferenceTypeBox,

  ...codecsAll,
};
