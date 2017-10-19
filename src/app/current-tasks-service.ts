import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CurrentTasksService {

	tasksHistory: Object;
	tasks: Object;
	on: Subject<any>;
	id: number;

	constructor() {
		this.tasks = new Object();
		this.tasksHistory = new Object();
		this.on = new Subject();
		this.id = 0;
	}

	addTask( description: string ) : number {
		this.tasks[ this.id ] = description;
		this.on.next( { eventName: 'taskAdded', target: this, id: this.id } );
		return this.id++;
	}

	deleteTask( id: number ) : void {
		if ( this.tasks.hasOwnProperty( id ) ) {
			let task = this.tasks[ id ];
			this.tasksHistory[ id ] = task;
			delete this.tasks[ id ];
			this.on.next( { eventName: 'taskDeleted', target: this, id: id } );
		}
	}

	getTasks() : any[] {
		//return Object.values( this.tasks );
		return Object.keys( this.tasks ).map( e => this.tasks[ e ] );
	}

	getHistory() : any[] {
		//return Object.values( this.tasksHistory );
		return Object.keys( this.tasksHistory ).map( e => this.tasksHistory[ e ] );
	}

	empty() : boolean {
		return ( Object.keys( this.tasks ).length == 0 );
	}
}