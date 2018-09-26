// Define a key: hardcoded in this example
// This corresponds to the key used for encryption
var KEY = new Uint8Array([
	0x40, 0x6d, 0x5e, 0x65, 0xb8, 0x55, 0x43, 0xf2, 0x49, 0x93, 0x20, 0xd7, 0xf4, 0xb4, 0x2d, 0xfa
]);

function hexStringToByteArray(str) {
    var result = new Uint8Array(16);
    var i = 0;
    while (str.length >= 2) {
    	if (str.substring(0,1) == ' ') {
    		str = str.substring(1,str.length);
    	}
        result[i] = parseInt(str.substring(0, 2), 16);
        str = str.substring(2, str.length);
        i++;
    }
    return result;
}

function initializeEME(video, mime, key) {
	KEY = hexStringToByteArray(key);
	// following config returns correctly in Chrome https or http (even localhost)
	var configWebM = [{
		initDataTypes: ['webm'],
		videoCapabilities: [{
			contentType: 'video/webm; codecs="vp8"'
		}]
	}];

	var configMp4 = [{
		"initDataTypes": ["cenc"],
		//"audioCapabilities": [{ "contentType": 'audio/mp4;codecs="mp4a.40.2"', robustness: 'SW_SECURE_CRYPTO' }],

		// codecs config is required
		"videoCapabilities": [{
			contentType: 'video/mp4;codecs="avc1.64001E"'
		}]
	}];

	var configMp4Mime = [{
		initDataTypes: ["cenc"],
		//"audioCapabilities": [{ "contentType": 'audio/mp4;codecs="mp4a.40.2"', robustness: 'SW_SECURE_CRYPTO' }],

		// codecs config is required
		videoCapabilities: [{
			contentType: 'video/mp4;codecs="avc1.64001E"'
		}]
	}];
	configMp4Mime[0].videoCapabilities[0].contentType = mime;

	var WIDEVINE_KEY_SYSTEM = 'com.widevine.alpha';
	var CLEARKEY_KEY_SYSTEM = 'org.w3.clearkey';


	video.addEventListener('encrypted', handleEncrypted, false);

	navigator.requestMediaKeySystemAccess(CLEARKEY_KEY_SYSTEM, configMp4Mime).then(
	  function(keySystemAccess) {
	    return keySystemAccess.createMediaKeys();
	  }
	).then(
	  function(createdMediaKeys) {
	    return video.setMediaKeys(createdMediaKeys);
	  }
	).catch(
	  function(error) {
	    console.error('Failed to set up MediaKeys', error);
	  }
	);
}

function handleEncrypted(event) {
	console.log("Encrypted event", event);
	//return;
	video = event.target;
	var session = video.mediaKeys.createSession();
	session.addEventListener('message', handleMessage, false);
	session.generateRequest(event.initDataType, event.initData).catch(
	  function(error) {
	    console.error('Failed to generate a license request', error);
	  }
	);
}

function handleMessage(event) {
  console.log('message event: ', event);
  // If you had a license server, you would make an asynchronous XMLHttpRequest
  // with event.message as the body.  The response from the server, as a
  // Uint8Array, would then be passed to session.update().
  // Instead, we will generate the license synchronously on the client, using
  // the hard-coded KEY at the top.
  var license = generateLicense(event.message);
  console.log('license: ', license);

  var session = event.target;
  session.update(license).catch(
    function(error) {
      console.error('Failed to update the session', error);
    }
  );
}

// Convert Uint8Array into base64 using base64url alphabet, without padding.
function toBase64(u8arr) {
  return btoa(String.fromCharCode.apply(null, u8arr)).
    replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
}

// This takes the place of a license server.
// kids is an array of base64-encoded key IDs
// keys is an array of base64-encoded keys
function generateLicense(message) {
  // Parse the clearkey license request.
  var request = JSON.parse(new TextDecoder().decode(message));
  // We only know one key, so there should only be one key ID.
  // A real license server could easily serve multiple keys.
  console.assert(request.kids.length === 1);

  var keyObj = {
    kty: 'oct',
    alg: 'A128KW',
    kid: request.kids[0],
    k: toBase64(KEY)
  };
  return new TextEncoder().encode(JSON.stringify({
    keys: [keyObj]
  }));
}


