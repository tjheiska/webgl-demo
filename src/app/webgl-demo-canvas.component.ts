import { Component, Input, OnInit, ViewChild } from
'@angular/core';

import { WebGLRendererService } from './opth/webgl/webgl-renderer-service';

import { WebGLDemoCanvas } from './webgl-demo-canvas';
@Component({
	selector: 'webgl-demo-canvas',
	template: `
		<div *ngIf="canvas">
			<canvas [attr.width]="canvas.width" 
			[attr.height]="canvas.height">
			</canvas>
		</div>
	`
})

export class WebGLDemoCanvasComponent implements OnInit {

	@Input() canvas: WebGLDemoCanvas;

	constructor( private renderer: WebGLRendererService ) {}

	ngOnInit() {
		//this.renderer.registerCanvas();
	}

	public setWidth( width: number ) { 
		this.canvas.width = Math.round( width ); 
	}

	public setHeight( height: number ) {
		this.canvas.height = Math.round( height );
	}
}