declare class ISOFile {
    itemsDataSize: number;
    flattenItemInfo(): void;
    getItem(item_id: number): any;
    releaseItem(item_id: number): number;
    processItems(callback: (item: any) => void): void;
    hasItem(name: string): number;
    getMetaHandler(): string | null;
    getPrimaryItem(): any;
    itemToFragmentedTrackFile(options?: any): ISOFile | null;
}
