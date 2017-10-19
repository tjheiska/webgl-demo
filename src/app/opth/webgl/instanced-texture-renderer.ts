import { OpthWebGLContext } from './webgl-context';
import { AbstractWebGLRenderer, WebGLRenderer } from './webgl-renderer';
import { vec3, vec4, mat4 } from 'gl-matrix';
//import { vec3 } from './vec3';

const MAX_POINTS: number = 65536;

interface Bounds {
	min: vec3;
	max: vec3;
}

/**
 * A simple rendering class with xyz-data as float texture. Coordinates are 
 * fetched with normalized [0-1] float pairs.
 */
export class InstancedTextureRenderer extends AbstractWebGLRenderer {

	private program: WebGLProgram;
	private indexVbo: WebGLBuffer;
	private xyzTex: WebGLTexture;
	private texWidth: number;
	private numPoints: number;
	private shouldValidate: boolean = true;
	private uTransform: WebGLUniformLocation;
	private texFloatEnabled: boolean;
	private bounds: Bounds;

	public constructor() { super(); }

	public create( gl: WebGLRenderingContext, options?: any ) {

		if ( !gl ) throw 'invalid WebGLRenderingContext';
		super.create( gl );

		this.program = super.createProgramFromSource( 
			options.vertexShaderSource, options.fragmentShaderSource );
		gl.useProgram( this.program );
		this.uTransform = gl.getUniformLocation( this.program, 
			'uTransform' );
		if ( !this.uTransform ) {
			throw 'Uniform \'uTransform\' not found.';
		}


		// Use texture max size to normalize keys
		this.texWidth = gl.getParameter( gl.MAX_TEXTURE_SIZE );
		//this.texWidth = 128;
		console.log( this.texWidth );

		// Check float texture compatibility
		this.texFloatEnabled = gl.getExtension('OES_texture_float');
		//this.texFloatEnabled = false;
		if ( !this.texFloatEnabled ) {
			console.log( 'OES_texture_float not supported!' );
			let uNext: WebGLUniformLocation = gl.getUniformLocation(
			this.program, 'uNext' );
			if ( !uNext ) {
				console.log( 'Uniform \'uNext\' not found.');
			}
			gl.uniform1f( uNext, 1.0 / this.texWidth );
			this.texWidth /= 4;
		}
		let uTexFloatEnabled: WebGLUniformLocation = gl.getUniformLocation(
			this.program, 'uTexFloatEnabled' );
		gl.uniform1i( uTexFloatEnabled, this.texFloatEnabled ? 1 : 0 );


		this.indexVbo = gl.createBuffer();
		this.genKeys( MAX_POINTS );

		this.xyzTex = gl.createTexture();
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.xyzTex );

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable( gl.DEPTH_TEST );
		gl.enable( gl.SAMPLE_ALPHA_TO_COVERAGE );
		console.log( 'antialias:' + gl.getContextAttributes().antialias );
		console.log( 'samples: ' + gl.getParameter( gl.SAMPLES ) );

	}

	private genKeys( len: number ): void {

		// generate keys
		let keys = new Float32Array( len * 2 );
		let d: number = this.texWidth;
		for ( let i : number = 0; i < len; i++ ) {
			keys[ i * 2 ] = ( i & ( d - 1 ) ) / d;
			keys[ i * 2 + 1 ] = ( i / d ); 
		}

		// vbo from key data
		const gl = this.gl;
		gl.bindBuffer( gl.ARRAY_BUFFER, this.indexVbo );
		gl.bufferData( gl.ARRAY_BUFFER, keys, 
			gl.STATIC_DRAW );

		// Connect data to program
		const vKey: GLint = 
			gl.getAttribLocation( this.program, 'vKey' );
		if ( vKey == -1 ) {
			throw 'Attribute \'vKey\' not found in program.';
		}
		gl.vertexAttribPointer( vKey, 2, gl.FLOAT, 
			false, 8, 0 );
		gl.enableVertexAttribArray( vKey );


	}

	fract( out: vec4, v: vec4 ): vec4 {
		out[ 0 ] = v[ 0 ] - Math.floor( v[ 0 ] );
		out[ 1 ] = v[ 1 ] - Math.floor( v[ 1 ] );
		out[ 2 ] = v[ 2 ] - Math.floor( v[ 2 ] );
		out[ 3 ] = v[ 3 ] - Math.floor( v[ 3 ] );
		return out;
	}

	encodeFloatRGBA( out: vec4, v: number ): vec4 {
		out.set( new Float32Array( [ 1.0 * v, 255.0 * v, 65025.0 * v, 
			160581375.0 * v ] ) );
		//vec4.scale( out, vec4.fromValues(1.0, 255.0, 65025.0, 160581375.0), v );
  		this.fract( out, out );
  		const a: vec4 = vec4.create(); a.set( [ 1.0 / 255.0, 1.0 / 255.0, 
  			1.0 / 255.0, 0.0 ] );
  		//const a: vec4 = 
  		//	vec4.fromValues( 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0 );
  		const tmp: vec4 = vec4.create(); tmp.set( [ out[ 1 ], out[ 2 ], 
  			out[ 3 ], out[ 3 ] ] );
   		vec4.sub( out, out, vec4.mul( a, a, tmp ) );
  		//vec4.sub( out, out, vec4.mul( a, a, 
  		//	vec4.fromValues( out[ 1 ], out[ 2 ], out[ 3 ], out[ 3 ] ) ) );
  		tmp.set( [ 255.0, 255.0, 255.0, 255.0 ] );
  		vec4.mul( out, out, tmp );
  		//vec4.mul( out, out, vec4.fromValues( 255.0, 255.0, 255.0, 255.0 ) );
  		return out;
	}

	getBounds( xyz: Float32Array, length: number ) : Bounds {
		let min: vec3 = vec3.create(); min.set( [ Number.MAX_VALUE, 
			Number.MAX_VALUE, Number.MAX_VALUE ] );
		let max: vec3 = vec3.create(); max.set( [ Number.MIN_VALUE, 
			Number.MIN_VALUE, Number.MIN_VALUE ] );
		for ( let i = 0; i < length; i++ ) {
			if ( Math.abs( xyz[ i * 3 ] ) > 7 || 
				 Math.abs( xyz[ i * 3 + 1 ] ) > 7 ||
				 Math.abs( xyz[ i * 3 + 2 ] ) > 7 ) {

				console.log( xyz[ i * 3 ] + ' ' + xyz[ i * 3 + 1 ] + ' ' +
				 xyz[ i * 3 + 2 ] );
			}	
			// min
			if ( xyz[ i * 3 ] < min[ 0 ] ) min[ 0 ] = xyz[ i * 3 ];
			if ( xyz[ i * 3 + 1 ] < min[ 1 ] ) min[ 1 ] = xyz[ i * 3 + 1 ]; 
			if ( xyz[ i * 3 + 2 ] < min[ 2 ] ) min[ 2 ] = xyz[ i * 3 + 2 ];
			// max
			if ( xyz[ i * 3 ] > max[ 0 ] ) max[ 0 ] = xyz[ i * 3 ];
			if ( xyz[ i * 3 + 1 ] > max[ 1 ] ) max[ 1 ] = xyz[ i * 3 + 1 ]; 
			if ( xyz[ i * 3 + 2 ] > max[ 2 ] ) max[ 2 ] = xyz[ i * 3 + 2 ];
		}
		return { min: min, max: max };
	}

	public setDataXYZ( xyz: Float32Array ): void {

		const numPoints: number = xyz.length / 3;

		// Ensure size 2^x
		let exp: number = Math.log( numPoints ) / Math.log( 2 );
		if ( exp != Math.floor( exp ) ) throw 'data length=' +
			numPoints + ' not power of two';

		// Set width and height
		//let width: number = Math.pow( 2, Math.ceil( exp / 2 ) );
		let width: GLsizei = this.texWidth;
		if ( numPoints < this.texWidth ) width = numPoints;
		let height: GLsizei = numPoints / width;
		console.log( 'numPoints: ' + numPoints + ' width: ' + width + 
			' height: ' + height );

		// Bind and uploas
		let gl: WebGLRenderingContext = this.gl;
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.xyzTex );
		/*
		let test: Float32Array = new Float32Array( 3 );
		test[ 0 ] = 0.0;
		test[ 1 ] = 0.0;
		test[ 2 ] = 0.0;
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 1, 1,
			0,	gl.RGB, gl.FLOAT, test );
		*/
		if ( this.texFloatEnabled ) {
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, width, height,
				0,	gl.RGB, gl.FLOAT, xyz );
		}
		else {
			let encXyz: Uint8Array = new Uint8Array( xyz.length / 3 * 16 );
			let bounds: Bounds = this.bounds = this.getBounds( xyz, 
				10000/*numPoints*/ );
			console.log( bounds );
			let size: vec3 = vec3.sub( vec3.create(), bounds.max, bounds.min );
			let v: vec3 = vec3.create();
			for ( let i = 0; i < numPoints; i++ ) {
				// Normalize
				let j: number = i * 3;
				vec3.set( v, xyz[ j ], xyz[ j + 1 ], xyz[ j + 2 ] );
				vec3.sub( v, v, bounds.min );
				vec3.div( v, v, size );
				// Encode
				let x: vec4 = this.encodeFloatRGBA( vec4.create(), v[ 0 ] );
				let y: vec4 = this.encodeFloatRGBA( vec4.create(), v[ 1 ] );
				let z: vec4 = this.encodeFloatRGBA( vec4.create(), v[ 2 ] );
				const k: number = i * 16;
				encXyz[ k ] = x[ 0 ];
				encXyz[ k + 1 ] = x[ 1 ];
				encXyz[ k + 2 ] = x[ 2 ];
				encXyz[ k + 3 ] = x[ 3 ];
				encXyz[ k + 4 ] = y[ 0 ];
				encXyz[ k + 5 ] = y[ 1 ];
				encXyz[ k + 6 ] = y[ 2 ];
				encXyz[ k + 7 ] = y[ 3 ];
				encXyz[ k + 8 ] = z[ 0 ];
				encXyz[ k + 9 ] = z[ 1 ];
				encXyz[ k + 10 ] = z[ 2 ];
				encXyz[ k + 11 ] = z[ 3 ];
			}
			console.log( encXyz );
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width * 4, height,
				0,	gl.RGBA, gl.UNSIGNED_BYTE, encXyz );
		}
		{
			let err: GLenum = gl.getError();
			if ( err != gl.NO_ERROR ) {
				throw 'Error creating texture:' + err;
			}
		}

		// Set parameters
		gl.texParameteri(gl.TEXTURE_2D, 
			gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, 
			gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, 
			gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// Connect texture to program
		const uCoord: WebGLUniformLocation = gl.getUniformLocation( 
			this.program, 'uCoord' );
		if ( !uCoord ) {
			throw 'Uniform \'uCoord\' not found.';
		}
		gl.uniform1i( uCoord, 0 );

		const uTexHeight: WebGLUniformLocation = gl.getUniformLocation( 
			this.program, 'uTexHeight' );
		if ( !uTexHeight ) {
			throw 'Uniform \'uTexHeight\' not found.';
		}
		gl.uniform1f( uTexHeight, < GLfloat >height );

		this.numPoints = numPoints;
	}

	public render() : void {
		try {
			this.validate();
			//console.log( 'program validation ok!')
		} catch( err ) {
			console.log( err );
			return;
		}
		let gl: WebGLRenderingContext = this.gl;
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		gl.drawArrays( gl.POINTS, 0, 10000/*this.numPoints*/ );
		gl.flush();
		{
			let err: GLenum = gl.getError();
			if ( err != gl.NO_ERROR ) {
				throw 'Error rendering:' + err;
			}
		}
		//console.log( 'render ok' );
		//window.setTimeout( this.render, 16 );
	}

	public setTransform( matrix: Float32Array ) {
		let m: Float32Array = matrix;
		//console.log( 'setTransform' );
		if ( !this.texFloatEnabled ) {
			let mat: mat4 = mat4.create(); mat.set( matrix );
			//mat.set( matrix );
			mat = mat4.translate( mat, mat, this.bounds.min );
			mat4.scale( mat, mat, vec3.sub( vec3.create(), this.bounds.max, 
				this.bounds.min ) );
			m = mat;
		}
		this.gl.uniformMatrix4fv( this.uTransform, false, m );

	}

	public validate() {
		if ( !this.shouldValidate ) return;
		// Validate program
		let gl: WebGLRenderingContext = this.gl;
		gl.validateProgram( this.program );
		if ( !gl.getProgramParameter( this.program, gl.VALIDATE_STATUS ) ) {
			let info = gl.getProgramInfoLog( this.program );
			throw 'Program validation failed.\n\n' + info;
		}
		this.shouldValidate = false;
	}

}
