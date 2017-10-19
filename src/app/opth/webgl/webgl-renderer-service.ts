/**
 * Collection of renderer factories.
 */
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { WebGLRenderer } from './webgl-renderer';
import { WebGLRendererFactory } from './webgl-renderer-factory';

Injectable() 
export class WebGLRendererService {

	private renderers: Object;
	onAddRenderer: Subject< any >;
	onError: Subject< any >;

	constructor() {
		this.renderers = new Object();	
		this.onAddRenderer = new Subject();
		this.onError = new Subject();
	}

	/**
	 * Function adds new renderer factory to the list
	 *
	 * @param id renderer id
	 * @param renderer renderer type factory
	 */
	addRenderer< T extends WebGLRenderer>( id: any, 
		renderer: WebGLRendererFactory< T > ): boolean {
		if ( this.renderers[ id ] ) {
			this.onError.next( 'Duplicate renderer \'' + id + '\'.' );
			return false;
		}
		this.renderers[ id ] = renderer;
		this.onAddRenderer.next( { "id": id, "renderer": renderer } );
		return true;
	}

	/**
	 * Creates promise of new renderer with factory identified by id
	 *
	 * @param id the id of the factory to be used for creation
	 * @param gl the WebGL rendering context to be used
	 *
	 * @return Promise of new renderer. The promise is realized when the 
	 * 			factory with requested id is available. 
	 */
	createRenderer< T extends WebGLRenderer >( id: any, 
		gl: WebGLRenderingContext ) : Promise<WebGLRenderer>  {

		let handleError: any = ( err: any, reject: any ) => {
			console.log( err );
			this.onError.next( err );
			reject( err );
		};

		let newInstance = ( factory: any, resolve: any, reject: any ): any => {
			factory.newInstance( gl )
			.then( ( instance ) => {
				resolve( instance );
			})
			.catch( ( err ) => {
				handleError( err, reject );
			});
		};

		return new Promise( ( resolve, reject ) => {
			// Id found => resolve immediately
			let r: WebGLRendererFactory< T > = this.renderers[ id ]; 
			if ( r ) {
				newInstance( r, resolve, reject );
			}
			// Wait for the requested factory
			else {
				let s: Subscription = this.onAddRenderer.subscribe(
					( event ) => {
						if ( event.id == id ) {
							newInstance( event.renderer, resolve, reject );
							s.unsubscribe();
						}
					},
					err => {
						handleError( err, reject );
					}
				);
			}

		});
	}
}