var a;
var lengthToRemove;
var positionToRemoveFrom;

function init() {
	a = ArrayBuffer(1024*1024*40);
	var a8 = new Uint8Array(a);
	for (var i = 0; i < a8.length; i++) {
		a8[i] = Number.parseInt(Math.random()*256)%255;
	}
}

function start() {
	lengthToRemove = 1024*1024;
	positionToRemoveFrom = lengthToRemove;
	update();
}

function update() {
	if (a.byteLength-lengthToRemove > 0 ) {
		console.log("Resizing buffer from "+positionToRemoveFrom+" with size "+(a.byteLength-lengthToRemove));
		var a8b = new Uint8Array(a, positionToRemoveFrom, a.byteLength-lengthToRemove);
		var b = ArrayBuffer(a.byteLength-lengthToRemove);
		var b8 = new Uint8Array(b);
		b8.set(a8b); 
		a = b;
		window.setTimeout(update, 1000);
	} else {
		console.log("done");
	}
}

init();
