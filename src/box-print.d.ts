declare namespace BoxParser {
    class Box {
        printHeader(output: any): void;
        print(output: any): void;
    }

    class FullBox extends Box {
        printHeader(output: any): void;
    }

    class ContainerBox extends Box {
        print(output: any): void;
    }
}

declare class ISOFile {
    print(output: any): void;
}
