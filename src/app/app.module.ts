import { BrowserModule } from '@angular/platform-browser';
import { NgModule, enableProdMode } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SocketIoModule, SocketIoConfig, Socket }
	from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import { Subscription } from 'rxjs/Subscription';

import { AppComponent } from './app.component';
import { WebGLDemoCanvasComponent } 
	from './webgl-demo-canvas.component';
import { LoaderModalComponent } from './loader-modal.component';
import { WebGLRenderedDirective } from './opth/webgl/webgl-rendered.directive';

import { PcPngLoaderService } from './pc-png-loader-service';
import { CurrentTasksService } from './current-tasks-service';

import { WebGLRendererFactory } from './opth/webgl/webgl-renderer-factory';
import { WebGLRendererService } from './opth/webgl/webgl-renderer-service';
import { InstancedTextureRenderer } 
	from './opth/webgl/instanced-texture-renderer';

import { CoordinateData } from './coordinate-data';


import * as $ from 'jquery';


enableProdMode();

const config : SocketIoConfig = { url: window.location.origin,
	options: { path: '/socket.io' } };

@NgModule({
  declarations: [
    AppComponent,
    WebGLDemoCanvasComponent,
    LoaderModalComponent,
    WebGLRenderedDirective
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    HttpClientModule,
  ],
  providers: [ PcPngLoaderService, CurrentTasksService, WebGLRendererService ],
  bootstrap: [AppComponent]
})

export class AppModule { 

	msgSubscription: Subscription;
	model: CoordinateData< Float32Array > = new CoordinateData< Float32Array >();
	initialized: boolean = false;

	public constructor( 
		private socket: Socket, 
		private pcPngLoader: PcPngLoaderService, 
		private http: HttpClient, 
		private tasks: CurrentTasksService,
		private renderers: WebGLRendererService ) {

		renderers.onError.subscribe(
			( err ) => {
				tasks.addTask( err );
		});
		renderers.onAddRenderer.subscribe(
			( factory ) => {
				let id = tasks.addTask( 'Renderer \'' + factory.id + '\' added...' );
				tasks.deleteTask( id );
		});

		// Bind websocket input
		let initTaskId = tasks.addTask('Initialization...');
		let id = tasks.addTask('Waiting for Socket.IO...');
		this.socket.fromEvent<any>('connect').subscribe(
			() => {
				if ( id != null ) {
					tasks.deleteTask( id );
					id = null;
				}
			}
		);
		this.msgSubscription = 
			this.socket.fromEvent<any>('initialize').subscribe(
			value => {
				if ( this.initialized ) window.location.reload();
				//tasks.deleteTask( id );
				console.log( value );

				let renderer = null;
				// Declare helper function
				let jobDone: any = ( id: number ) => {
					console.log( 'job done.');
					tasks.deleteTask( id );
					if ( tasks.getTasks().length == 1 ) {
						console.log('All jobs done!');
						tasks.deleteTask( initTaskId );
						this.initialized = true;

						renderer.setDataXYZ( this.model.get.data );

						let m: Float32Array;
						let onTimeout: any = () => {
							renderer.setTransform( m );
							renderer.render();
							setTimeout( onTimeout, 16 );
						};
						let started: boolean = false;
						
						this.socket.fromEvent<any>('setMatrix').subscribe(
						( newMatrix: ArrayBuffer ) => {
							m = new Float32Array( newMatrix );
							if ( !started ) { 
								onTimeout(); 
								started = true;
							}
							//console.log( m );
							//renderer.render();
							
						});
						this.socket.emit( 'start' );

					}
				};

				// Create renderer factory
				let factory: WebGLRendererFactory< InstancedTextureRenderer > 
					= new WebGLRendererFactory (
						InstancedTextureRenderer,
						this.http,
						{ 
							vertexShaderUrl: value.program.vertexShader,
							fragmentShaderUrl: value.program.fragmentShader
						}
				);
				{
					let id = tasks.addTask( 'Waiting for renderer...');
					factory.onCreateRenderer.subscribe( r => {
						console.log( 'renderer created.' );
						renderer = r;
						jobDone( id );
					});
				}

				{
					let id = tasks.addTask( 'Loading vertex shader...');
					factory.onVertexShaderLoad.subscribe( ( event ) => {
						console.log( 'Vertex shader loaded!');
						jobDone( id );
					});
				}	
				{
					let id = tasks.addTask( 'Loading fragment shader...');
					factory.onFragmentShaderLoad.subscribe( ( event ) => {
						console.log( 'Fragment shader loaded!');
						jobDone( id );
					});
				}

				// Add factory to renderer list
				const rendererId: string = 'defaultRenderer';
				renderers.addRenderer( rendererId, factory );

				// Data
				{
					let id = tasks.addTask( 'Loading XYZ-data...');
					if ( value.data 
						&& value.data.url 
						&& value.data.numPoints ) {

						let url: string = value.data.url;
						let numPoints: number = value.data.numPoints;
						console.log('Loading XYZ-data as png...');
						pcPngLoader.load( url, numPoints )
						.then( ( data: Float32Array ) => {
							console.log('XYZ-data loaded.');
							this.model.setData( data );
							jobDone( id );
						})
						.catch( err => {
							console.log( err )
						});
					}
				}

			},
			error => console.log(error)
		)

	}
}
