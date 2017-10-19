import { OpthWebGLContext } from './webgl-context';

export interface WebGLRenderer {
	render();
	create( gl: WebGLRenderingContext, options?: any );
	setViewport( width: number, height: number );
}

/**
 * Abstract class implementing basic help functions for renderers.
 */
export abstract class AbstractWebGLRenderer implements WebGLRenderer {

	protected gl: WebGLRenderingContext;

	public abstract render();

	protected constructor() {}

	public create( gl: WebGLRenderingContext, options?: any ) { this.gl = gl; }

	protected static createShader ( gl: WebGLRenderingContext, 
		sourceCode: string, type: GLenum ) {

		console.log("createShader");
		var shader = gl.createShader(type);
		console.log("shaderSource");
		gl.shaderSource(shader, sourceCode);
		console.log("compileShader");
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log("exception");
			var info = gl.getShaderInfoLog(shader);
			console.log(info);
			throw 'Could not compile WebGL-shader. \n\n' 
			+ info;
			//console.log("This should not be reached.");
		}
		return shader;
	}

	protected static createProgram( gl: WebGLRenderingContext,
		vertexShader : WebGLShader, 
		fragmentShader: WebGLShader ) : WebGLProgram {

		let program = gl.createProgram();
		gl.attachShader( program, vertexShader );
		gl.attachShader( program, fragmentShader );
		gl.linkProgram( program );
		if( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
			let info: string =  gl.getProgramInfoLog( program );
			throw 'Could not compile WebGL program. \n\n' + info;
		}

		return program;
	}

	protected createProgramFromSource( vsSrc: string, fsSrc: string ) {
		let gl: WebGLRenderingContext = this.gl;
		return AbstractWebGLRenderer.createProgram( gl, 
			AbstractWebGLRenderer.createShader( gl, vsSrc, gl.VERTEX_SHADER ), 
			AbstractWebGLRenderer.createShader( gl, fsSrc, gl.FRAGMENT_SHADER ));
	}

	public setViewport( width: number, height: number ) {
		this.gl.viewport( 0, 0, width, height );
	}
}
