import { Injectable, ElementRef } 
	from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

@Injectable()
export class PcPngLoaderService {
	imageElement : HTMLImageElement = new Image();
	canvas : HTMLCanvasElement = 
		document.createElement('canvas');
	on : Subject<any> = new Subject();

	public load( url: string, numPoints: number ) 
	: Promise<Float32Array> {

		return new Promise( (resolve, reject) => {
			this.imageElement.onload = (e) => {
				try {
					resolve( this.unpackImg( numPoints ) );
					this.on.next({ eventName: "imageLoad", 
						image: this.imageElement });
				} catch(e) {
					reject(e);
				}
			};
			this.imageElement.src = url;
		});
	}

	private unpackImg( numPoints: number ) : Float32Array {
		
		let img: HTMLImageElement = this.imageElement;
		let ctx: CanvasRenderingContext2D = this.canvas.getContext('2d');
		let width: number = img.naturalWidth;
		let height: number = img.naturalHeight;
		ctx.canvas.width = width;
		ctx.canvas.height = height;

		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		//ctx.msImageSmoothingEnabled = false;

		ctx.globalCompositeOperation = "copy";
		ctx.drawImage( img, 0, 0 );
		const imageData: ImageData = ctx.getImageData( 0, 0, 
			width, height );
		const inputBytes: Uint8ClampedArray = imageData.data;
		const buf: ArrayBuffer = inputBytes.buffer;
		console.log( buf );

		// interleave array
		// x0y0z0aa...x1y1z1aa...x2y2z2aa...x3y3z3aa...
		// => x0x1x2x3y0y1y2y3z0z1z2z3
		const N: number = numPoints * 4;
		let outputBuffer: ArrayBuffer = new ArrayBuffer( inputBytes.length / 4 * 3 );
		let outputBytes: Uint8ClampedArray = 
			new Uint8ClampedArray( outputBuffer );
		//outputBytes.forEach( ( val, idx, arr ) => {
		for ( let idx: number = 0; idx < outputBytes.length; idx++ ) {

			if ( idx < 12 ) {
				let i: number = ( idx % 4 ) * N + Math.floor( idx / 12 ) 
				+ Math.floor( idx / 4);
				console.log( i );
				console.log( inputBytes[ i ] );
			}
			outputBytes[ idx ] = inputBytes[ ( idx % 4 ) * N + Math.floor( idx / 12 ) 
				+ Math.floor( idx / 4) ];
		};
		console.log( outputBytes.slice( 0, 12 ) );
		console.log( outputBytes.slice( 12, 24 ) );


		let floats = new Float32Array( outputBytes.buffer );
		console.log(floats);

		return floats;
	}
}