declare namespace BoxParser {
    const DIFF_BOXES_PROP_NAMES: string[];
    const DIFF_PRIMITIVE_ARRAY_PROP_NAMES: string[];

    function boxEqualFields(box_a: any, box_b: any): boolean;
    function boxEqual(box_a: any, box_b: any): boolean;
}
