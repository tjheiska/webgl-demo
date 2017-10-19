import { Component, HostListener, ViewChild, OnInit, 
	ElementRef, Input } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
//import { WebGLDemoCanvasComponent } 
//from './webgl-demo-canvas.component';
//import { WebGLRenderedDirective } from './opth/webgl/webgl-rendered.directive';
import { PcPngLoaderService } from './pc-png-loader-service';
import { LoaderModalComponent } from './loader-modal.component';

interface TabContent {
	id: string;
	label: string;
	ariaControls: string;
	ariaLabelledBy: string;
	html: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'app';
  
  @ViewChild('mainCanvas') 
  mainCanvas: ElementRef;
  //mainCanvas: WebGLDemoCanvasComponent;
  @ViewChild('dataPngCanvas')
  dataPngCanvas: ElementRef;
  @ViewChild('loaderModal')
  loaderModal: LoaderModalComponent;
  @ViewChild('collapseRow')
  collapseRow: ElementRef;

  @Input() icon : string = "fa fa-chevron-down";
  @Input() collapseExpanded : string | boolean = false;
  @Input() tabContents: TabContent[];

  @HostListener('window:resize')
  onResize(event) {
  	this.resizeCanvas();
  }

  onClickCollapse( event: any) {
  	this.collapseExpanded = !this.collapseExpanded;
  	if (this.collapseExpanded) {
  		this.icon = "fa fa-chevron-up";
  	}
  	else {
  		this.icon = "fa fa-chevron-down";
  	}
  }

  constructor(private pcPngLoader: PcPngLoaderService,
  	private http: HttpClient ) {

  	// Subscribe data-loader imageLoad-event to update debug image
  	pcPngLoader.on.filter( event => 
  		event.eventName == 'imageLoad')
  	.subscribe( event => {
  		console.log('draw debug');
  		let c = this.dataPngCanvas.nativeElement.getContext('2d');
  		console.log(event);
  		c.canvas.width = event.image.width;
  		c.canvas.height = event.image.height;
  		console.log( c );
  		c.drawImage( event.image, 0, 0 )
  	});

  	// Load tab content
  	http.get<TabContent[]>( '/api/info-pages' ).subscribe( 
  	data => {
		this.tabContents = data;	
  	},
  	err => {
  		console.log( err );
  	});
  }

  ngOnInit() {
  	this.resizeCanvas();
  	//this.mainCanvas.canvas = this.getCanvasSize();
  	/*this.pcPngLoader.load('api/point-clouds?type=conical-helix&numSamples=10000'
  		+ '&radius=0.1&fractionBits=7', 10000);
	*/
	//console.log(this.loaderModal);
	//this.loaderModal.toggle();
  }

  private getCanvasSize() {
  	let winwidth : number = window.innerWidth;
  	let winheight : number = window.innerHeight 
  		- this.collapseRow.nativeElement.clientHeight;
  	let ratio = winwidth / winheight;
  	let goalRatio = 16 / 9;
  	let w : number;
  	let h : number;
  	if (ratio < goalRatio) {
  		w = winwidth;
  		h = w / goalRatio;
  	}
  	else {
  		h = winheight;
  		w = h * goalRatio;
  	}
  	return { width: Math.round( w ), height: Math.round( h ) };
  }

  private resizeCanvas() {
  	let size = this.getCanvasSize();
  	this.mainCanvas.nativeElement.width = size.width;
  	this.mainCanvas.nativeElement.height = size.height;
  }
}
