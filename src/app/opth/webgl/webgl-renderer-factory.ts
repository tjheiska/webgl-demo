/**
 * Generic factory for webgl-renderer
 */
import { WebGLRenderer } from './webgl-renderer';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/first';
import { HttpClient } from '@angular/common/http';

/**
 * Factory class to create and initialize common properties of WebGL-renderer
 */
export class WebGLRendererFactory< T extends WebGLRenderer > {

	//private ctor: { new( gl: WebGLRenderingContext ): T; }
	private vertexShaderSrc: string = null;
	private fragmentShaderSrc: string = null;

	public onCreateRenderer: Subject< any > = new Subject(); 
	public onVertexShaderLoad: Subject<any> = new Subject();
	public onFragmentShaderLoad: Subject<any> = new Subject();

	public constructor( private ctor: { new(): T }, 
		private http: HttpClient, options: any ) {
		if ( options.vertexShaderUrl ) {
			this.loadVertexShader( options.vertexShaderUrl );
		}
		if ( options.fragmentShaderUrl ) {
			this.loadFragmentShader( options.fragmentShaderUrl );
		}
	}

	private loadFragmentShader( url: string ) {
		this.loadShader( url, data => { 
			this.fragmentShaderSrc = data;
			this.onFragmentShaderLoad.next(); 
		} );
	}

	private loadShader( url: string, callback: any ) {

		let http = this.http;
		http.get( url, { responseType: 'text' } ).subscribe( 
			data => {
				callback( data );
			},
			err => {
				console.log( 'error: ' + err );
			}
		);
	}

	private loadVertexShader( url: string ) {
		this.loadShader( url, data => { 
			this.vertexShaderSrc = data;
			this.onVertexShaderLoad.next();
		} );
	}

	public newInstance( gl: WebGLRenderingContext ) : Promise< WebGLRenderer > {

		// Inner function to recursively ensure that prerequirements are met
		let resolveInstance = (resolve: any, reject: any ) :void  =>  {

			// Check vertex shader
			if ( this.vertexShaderSrc == null ) {
				this.onVertexShaderLoad.first()
				.subscribe( () => {
					resolveInstance( resolve, reject );
				},
				( err ) => {
					reject( err );
				}
				);
				return;
			}

			// Check fragment shader
			if ( this.fragmentShaderSrc == null ) {
				this.onFragmentShaderLoad.first()
				.subscribe( () => {
					resolveInstance( resolve, reject );
				},
				( err ) => {
					reject( err );
				});
				return;
			}

			// Create instance
			console.log( this.ctor );
			let instance: T = new this.ctor();
			try {
				instance.create( gl, { vertexShaderSource: this.vertexShaderSrc,
					fragmentShaderSource: this.fragmentShaderSrc } );
				this.onCreateRenderer.next( instance );
				resolve( instance );
			} catch ( err ) {
				reject( err );
			}
		}

		return new Promise( 
			( resolve, reject ) => {
				// Resolve recursively
				resolveInstance( resolve, reject );
			}
		);

	}
}
