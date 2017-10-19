import { Subject } from 'rxjs/Subject';

export class ReadOnly< T > {
	public readonly data: T;
	public constructor( data: T ) { this.data = data; }
}

export class CoordinateData< T > {

	public onDataChanged: Subject< CoordinateData< T > > = new Subject();
	private data: T;
	public get: ReadOnly< T >;

	public setData( data: T ) {
		this.data = data;
		this.get = new ReadOnly< T >( data );
		this.onDataChanged.next( this );
	}

}