var a;

function init() {
}

function memcpy(dst, dstOffset, src, srcOffset, byteLength) {
  var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
  var srcU8 = new Uint8Array(src, srcOffset, byteLength);
  dstU8.set(srcU8);
}

function start() {
	var i, j, k;
	var offset;
	var startDate;
	var shift_sizes = [ 10, 100, 1000, 10000, 100000, 1000000 ];
	var buffer_sizes = [ 5000, 50000, 500000, 5000000, 50000000 ];
	var nb_iter = 1000;	
	var size;
	
	for (k = 0; k < buffer_sizes.length; k++) {
		startDate = new Date();
		a = ArrayBuffer(buffer_sizes[k]);
		console.log("Buffer of size "+a.byteLength+" created and initialized in "+(new Date() - startDate)+" ms");

		startDate = new Date();	
		for (j = 0; j < shift_sizes.length; j++) {	
			size = shift_sizes[j];
			if (size > buffer_sizes[k]) break;
			for (i = 0; i < nb_iter; i++) {
				offset = Math.random()*(a.byteLength-size);
				memcpy(a, offset+size, a, offset, a.byteLength-size-offset);
			} 
			console.log("End of "+nb_iter+" Memmove of size "+size+" in a buffer of size "+buffer_sizes[k]+", duration: "+(new Date() - startDate)+" ms");
		}
	}
}

