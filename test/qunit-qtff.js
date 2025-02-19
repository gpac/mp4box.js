// QTFF .MOV file format tests
QUnit.module("QTFF");

// Creates new copy of object with only the property keys also in template
function prunedObject(object, template) {
  var pruned = { };
  for (var key in template) {
    if (key in object)
      pruned[key] = object[key];
  }
  return pruned;
}

QUnit.asyncTest( "QTFF meta", function(assert) {
  var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
  var mp4boxfile = MP4Box.createFile();
  mp4boxfile.onReady = function(info) {
    window.clearTimeout(timeout);
    assert.ok(true, "moov found!" );

    var metas = mp4boxfile.getBoxes("meta");
    assert.ok(metas, "metas is not null");
    assert.strictEqual(metas.length, 2, "two metas fonud");
    assert.strictEqual(metas[0].type, "meta", "Correct meta box");
    assert.strictEqual(metas[1].type, "meta", "Correct meta box");

    /* A few fields in the first meta */
    assert.strictEqual(metas[0].boxes[0].type, "hdlr", "Correct hdlr box");
    assert.strictEqual(metas[0].boxes[1].type, "keys", "Correct keys box");
    assert.strictEqual(metas[0].boxes[2].type, "ilst", "Correct ilst box");

    assert.strictEqual(metas[0].boxes[1].count, 2);
    [
      "mdtacom.apple.quicktime.camera.lens_model",
      "mdtacom.apple.quicktime.camera.focal_length.35mm_equivalent"
    ].map(function(val, i) {
      assert.strictEqual(metas[0].boxes[1].keys[i + 1], val, "key correct: " + (i + 1));
    });

    assert.strictEqual(Object.keys(metas[0].boxes[2].boxes).length, 2);
    [
      {
        type: ItifTypes.UTF8, value: "iPhone 14 Pro back camera 9mm f/2.8",
        country: 17477, countryString: "DE", language: 5575, languageString: "eng",
      },
      {
        type: ItifTypes.BE_SIGNED_INT, value: 75,
        country: 17477, countryString: "DE", language: 5575, languageString: "eng",
      }
    ].map(function(val, i) {
      var box = prunedObject(metas[0].boxes[2].boxes[i + 1], val);
      assert.deepEqual(box, val, "ilst values correct:" + (i + 1));
    });

    /* This file has a second meta with lots more data */
    assert.strictEqual(metas[1].boxes[0].type, "hdlr", "Correct hdlr box");
    assert.strictEqual(metas[1].boxes[1].type, "keys", "Correct keys box");
    assert.strictEqual(metas[1].boxes[2].type, "ilst", "Correct ilst box");

    assert.strictEqual(metas[1].boxes[1].count, 11, "Correct number of keys");
    [
      "mdtacom.apple.quicktime.location.accuracy.horizontal",
      "mdtacom.apple.quicktime.live-photo.auto",
      "mdtacom.apple.quicktime.full-frame-rate-playback-intent",
      "mdtacom.apple.quicktime.live-photo.vitality-score",
      "mdtacom.apple.quicktime.live-photo.vitality-scoring-version",
      "mdtacom.apple.quicktime.location.ISO6709",
      "mdtacom.apple.quicktime.make",
      "mdtacom.apple.quicktime.model",
      "mdtacom.apple.quicktime.software",
      "mdtacom.apple.quicktime.creationdate",
      "mdtacom.apple.quicktime.content.identifier",
    ].map(function(val, i) {
      assert.strictEqual(metas[1].boxes[1].keys[i + 1], val, "key correct: " + (i + 1));
    });

    assert.strictEqual(Object.keys(metas[1].boxes[2].boxes).length, 11);
    [
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "7.176223" },
      { type: ItifTypes.BE_UNSIGNED_INT, country: 0, language: 0, value: 1 },
      { type: ItifTypes.BE_SIGNED_INT, country: 0, language: 0, value: 1n },
      { type: ItifTypes.BE_FLOAT32, country: 0, language: 0, value: 0.9398496150970459 },
      { type: ItifTypes.BE_SIGNED_INT, country: 0, language: 0, value: 4n },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "+32.0532+076.7050+2083.109/" },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "Apple" },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "iPhone 14 Pro" },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "18.0" },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "2024-10-08T14:52:09+0530" },
      { type: ItifTypes.UTF8, country: 0, language: 0, value: "C83404C7-130C-474E-B5E7-9865353C2DE7" },
    ].map(function(val, i) {
      var box = prunedObject(metas[1].boxes[2].boxes[i + 1], val);
      assert.deepEqual(box, val, "ilst values correct: " + (i + 1));
    });
  }

  var url = mediaTestBaseUrl + 'mov/iphone.mov';
  getFile(url, function (buffer) {
    mp4boxfile.appendBuffer(buffer);
    QUnit.start();
  });
});

