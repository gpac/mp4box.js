declare namespace BoxParser {
    class SampleEntry {
        isVideo(): boolean;
        isAudio(): boolean;
        isSubtitle(): boolean;
        isMetadata(): boolean;
        isHint(): boolean;
        getCodec(): string;
        getWidth(): string;
        getHeight(): string;
        getChannelCount(): string;
        getSampleRate(): string;
        getSampleSize(): string;
    }

    class VisualSampleEntry extends SampleEntry {
        isVideo(): boolean;
        getWidth(): number;
        getHeight(): number;
    }

    class AudioSampleEntry extends SampleEntry {
        isAudio(): boolean;
        getChannelCount(): number;
        getSampleRate(): number;
        getSampleSize(): number;
    }

    class SubtitleSampleEntry extends SampleEntry {
        isSubtitle(): boolean;
    }

    class MetadataSampleEntry extends SampleEntry {
        isMetadata(): boolean;
    }

    function decimalToHex(d: number, padding?: number): string;

    class avc1SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class avc2SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class avc3SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class avc4SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class hev1SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class hvc1SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class vvc1SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class vvi1SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class mp4aSampleEntry extends AudioSampleEntry {
        getCodec(): string;
    }

    class stxtSampleEntry extends SampleEntry {
        getCodec(): string;
    }

    class vp08SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class vp09SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }

    class av01SampleEntry extends VisualSampleEntry {
        getCodec(): string;
    }
}
