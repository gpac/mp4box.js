import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class SphereRegion {
  centre_azimuth: number;
  centre_elevation: number;
  centre_tilt: number;
  range_included_flag: boolean;
  azimuth_range: number;
  elevation_range: number;
  interpolate_included_flag: boolean;
  interpolate: boolean;

  toString() {
    let s = 'centre_azimuth: ';
    s += this.centre_azimuth;
    s += ' (';
    s += this.centre_azimuth * 2 ** -16;
    s += '°), centre_elevation: ';
    s += this.centre_elevation;
    s += ' (';
    s += this.centre_elevation * 2 ** -16;
    s += '°), centre_tilt: ';
    s += this.centre_tilt;
    s += ' (';
    s += this.centre_tilt * 2 ** -16;
    s += '°)';
    if (this.range_included_flag) {
      s += ', azimuth_range: ';
      s += this.azimuth_range;
      s += ' (';
      s += this.azimuth_range * 2 ** -16;
      s += '°), elevation_range: ';
      s += this.elevation_range;
      s += ' (';
      s += this.elevation_range * 2 ** -16;
      s += '°)';
    }
    if (this.interpolate_included_flag) {
      s += ', interpolate: ';
      s += this.interpolate;
    }
    return s;
  }
}

class CoverageSphereRegion {
  view_idc: number;
  sphere_region: SphereRegion;

  toString() {
    let s = '';
    if (this.view_idc) {
      s += 'view_idc: ';
      s += this.view_idc;
      s += ', ';
    }
    s += 'sphere_region: {';
    s += this.sphere_region;
    s += '}';
    return s;
  }
}

export class coviBox extends FullBox {
  static override readonly fourcc = 'covi' as const;
  box_name = 'CoverageInformationBox' as const;

  coverage_shape_type: number;
  default_view_idc: number;
  coverage_regions: Array<CoverageSphereRegion>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.coverage_shape_type = stream.readUint8();
    const num_regions = stream.readUint8();
    const f = stream.readInt8();
    const view_idc_presence_flag = f & 0x80;
    if (view_idc_presence_flag) {
      this.default_view_idc = (f & 0b01100000) >> 5;
    }
    this.coverage_regions = new Array<CoverageSphereRegion>();
    for (let i = 0; i < num_regions; i++) {
      const region = new CoverageSphereRegion();
      if (view_idc_presence_flag) {
        region.view_idc = stream.readUint8() >> 6;
      }
      region.sphere_region = this.parseSphereRegion(stream, true, true);
      this.coverage_regions.push(region);
    }
  }

  parseSphereRegion(
    stream: MultiBufferStream,
    range_included_flag: boolean,
    interpolate_included_flag: boolean,
  ) {
    const sphere_region = new SphereRegion();
    sphere_region.centre_azimuth = stream.readInt32();
    sphere_region.centre_elevation = stream.readInt32();
    sphere_region.centre_tilt = stream.readInt32();
    sphere_region.range_included_flag = range_included_flag;
    if (range_included_flag) {
      sphere_region.azimuth_range = stream.readUint32();
      sphere_region.elevation_range = stream.readUint32();
    }
    sphere_region.interpolate_included_flag = interpolate_included_flag;
    if (interpolate_included_flag) {
      sphere_region.interpolate = (stream.readUint8() & 0x80) === 0x80;
    }
    return sphere_region;
  }
}
