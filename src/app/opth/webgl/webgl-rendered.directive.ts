import { Directive, ElementRef, OnInit, Input, DoCheck } from '@angular/core';
import { WebGLRendererService } from './webgl-renderer-service';
import { WebGLRenderer } from './webgl-renderer';
import { CurrentTasksService } from '../../current-tasks-service';

 @Directive({ selector: '[webGLRendered]'})
 export class WebGLRenderedDirective implements OnInit, DoCheck {

 	@Input() webGLRendererId: string;
 	private renderer: WebGLRenderer;

 	constructor( private el: ElementRef, 
 		private rendererService: WebGLRendererService,
 		private taskService: CurrentTasksService ) {}

 	ngOnInit() {
 		console.log( 'create renderer \'' + this.webGLRendererId + '\'.' );
 		let id = this.taskService.addTask('Creating WebGL-context...');
 		let gl: WebGLRenderingContext = 
 			this.el.nativeElement.getContext('webgl');
 		if ( !gl ) gl = this.el.nativeElement.getContext('experimental-webgl');
 		if ( !gl ) return;
 		this.taskService.deleteTask( id );
 		console.log( gl.getContextAttributes() );
 		let reqId = this.taskService.addTask( 'Requesting renderer: \'' + 
 			this.webGLRendererId + '\'.' );
 		this.rendererService.createRenderer( 
 			this.webGLRendererId, gl )
 			.then( ( r: WebGLRenderer ) => { 
 				this.renderer = r;
 				this.taskService.deleteTask( reqId );
 			 });
 	}
 	ngDoCheck() {
 		if ( this.el && this.renderer ) {
	 		let e: HTMLCanvasElement = this.el.nativeElement;
 			this.renderer.setViewport( e.width, e.height );
 		}
 	}
 }