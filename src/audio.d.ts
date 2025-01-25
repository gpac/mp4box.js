declare class AudioSpecificConfig {
    static getAudioObjectType(stream: any): number;
    samplingFrequencyIndex: number;
    samplingFrequency: number;
    channelConfiguration: number;
    sbrPresentFlag: number;
    psPresentFlag: number;
    extensionAudioObjectType: number;
    extensionSamplingFrequencyIndex: number;
    parse(stream: any, audioObjectType: number): void;
}
