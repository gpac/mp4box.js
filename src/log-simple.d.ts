declare const Log: {
    setLogLevel: (level: number) => void;
    debug: (module: string, msg: string) => void;
    log: (module: string, msg: string) => void;
    info: (module: string, msg: string) => void;
    warn: (module: string, msg: string) => void;
    error: (module: string, msg: string) => void;
};
