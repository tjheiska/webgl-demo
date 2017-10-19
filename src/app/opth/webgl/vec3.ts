export class vec3 extends Float32Array {

	public constructor() {
		super( 3 );
	}
	public x(): number {
		return this[ 0 ];
	}
	public y(): number {
		return this[ 1 ];
	}
	public z(): number {
		return this[ 2 ];
	}
	public static sub( out: vec3, l: vec3, r: vec3 ) : vec3 {
		out[ 0 ] = l.x() - r.x();
		out[ 1 ] = l.y() - r.y();
		out[ 2 ] = l.z() - r.z();
		return out;
	}
}