declare namespace BoxParser {
    class Box {
        writeHeader(stream: DataStream, msg?: string): void;
        write(stream: DataStream): void;
    }

    class FullBox extends Box {
        writeHeader(stream: DataStream): void;
    }

    class ContainerBox extends Box {
        write(stream: DataStream): void;
    }

    class TrackReferenceTypeBox extends Box {
        write(stream: DataStream): void;
    }
}
