import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';
import { CurrentTasksService } from './current-tasks-service';

const modalId : string = '#nativeModal';

@Component({
	selector: 'loader-modal',
	templateUrl: './loader-modal.component.html',
	styleUrls: [ './loader-modal.component.css' ]
})
export class LoaderModalComponent implements OnInit {

	@ViewChild('showLoader') showLoaderBtn: ElementRef;
	isVisible: boolean;
	waitEvent: boolean;
	@Input() tasks: any[];
	@Input()history: any[];

	constructor( private taskService: CurrentTasksService ) {
		this.isVisible = false;
		this.waitEvent = false;
	}

	ngOnInit() {

		// These lines are needed to sync modal visibility
		let setVisible: any = ( flag: boolean ) => {
			this.waitEvent = false;
			if ( flag != this.isVisible ) {
				this.showModal( this.isVisible );
			}
		}
		$( modalId ).on('hidden.bs.modal', function (e) {
  			setVisible( false );
		});
		$( modalId ).on('shown.bs.modal', function (e) {
  			setVisible( true );
		});

		// Listen for task update
		let update : any = () => {
			this.getTasks();
			this.getHistory();
			if ( ( this.taskService.empty() ) ==  ( this.isVisible ) ) {
				this.toggle();
			}
		}
		this.taskService.on.subscribe( event => {
			update();
		});

		// Initial update
		update();

	}

	showModal( show: boolean ) : void {
		if ( this.waitEvent ) return;
		this.waitEvent = true;
		let cmd: string = show ? 'show' : 'hide';
		$( modalId ).modal(cmd);
	}

	toggle(): void {

		this.isVisible = !this.isVisible;

		// Call modal only if previous event is already handled
		// the event callback will call modal again if necessary
		this.showModal( this.isVisible );

	}

	getTasks() {
		this.tasks = this.taskService.getTasks();
	}

	getHistory() {
		this.history = this.taskService.getHistory();
	}

}
