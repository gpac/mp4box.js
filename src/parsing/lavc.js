/*
* Copyright (c) 2024. Paul Higgs
* License: BSD-3-Clause (see LICENSE file)
*/


function AVS3TemporalLayer(_temporal_layer_id, _frame_rate_code, _temporal_bit_rate_lower, _temporal_bit_rate_upper) {
    this.temporal_layer_id = _temporal_layer_id;
    this.frame_rate_code = new BinaryValue(_frame_rate_code, 3);
    this.temporal_bit_rate_lower = _temporal_bit_rate_lower;
    this.temporal_bit_rate_upper = _temporal_bit_rate_upper;
}
AVS3TemporalLayer.prototype.toString = function() {
    return "{temporal_layer_id:" + this.temporal_layer_id +
                ", frame_rate_code:" + this.frame_rate_code.toString() +
                ", temporal_bit_rate_lower:" + this.temporal_bit_rate_lower +
                ", temporal_bit_rate_upper:" + this.temporal_bit_rate_upper + "}";
};

function AVS3TemporalLayers(noarg) {
    this.layers = [];
}
AVS3TemporalLayers.prototype.push = function(layer) {
    this.layers.push(layer);
};
AVS3TemporalLayers.prototype.toString = function() {
    var l = [];
    this.layers.forEach( function(layer) {
        l.push(layer.toString);
    });
    return l.join(", ");
};


// LAVS3 configuration box (layered AVS3 video)
BoxParser.createBoxCtor("lavc", function(stream) {
    this.configurationVersion = stream.readUint8();
    if (this.configurationVersion != 1) {
        Log.error("lavc version "+this.configurationVersion+" not supported");
        return;
    }
    this.numTemporalLayers = stream.readUint8();
    this.layers=new AVS3TemporalLayers();
    for (var i=0; i<this.num_temporal_layers; i++) {
        var tmp_val1 = stream.readUint8();
        var tmp_val2 = stream.readUint32();

        this.layers.push(new AVS3TemporalLayer(
            (tmp_val1 >> 5) & 0x07,
            (tmp_val1 >> 1) & 0x0f,
            (tmp_val2 >> 14) & 0x0003ffff,
            (tmp_val2 >> 2) & 0x00000fff) );
    }
});
