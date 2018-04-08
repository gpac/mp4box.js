function initializeEME(video) {
	// following config returns correctly in Chrome https or http (even localhost)
	var config = [{
		"initDataTypes": ["cenc"],
		//"audioCapabilities": [{ "contentType": 'audio/mp4;codecs="mp4a.40.2"', robustness: 'SW_SECURE_CRYPTO' }],

		// codecs config is required
		"videoCapabilities": [{ "contentType": 'video/mp4;codecs="avc1"'}]
	}];

	var WIDEVINE_KEY_SYSTEM = 'com.widevine.alpha';
	var CLEARKEY_KEY_SYSTEM = 'org.w3.clearkey';

	var RequestedKeySystem = WIDEVINE_KEY_SYSTEM;

	video.addEventListener('encrypted', handleEncrypted, false);

	navigator.requestMediaKeySystemAccess(RequestedKeySystem, config).then(
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
  console.log("Encrypted message event", event);
}


