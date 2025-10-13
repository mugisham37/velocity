declare module 'rxjs' {
  export interface Observable<T> {
    pipe<A>(op1: any): Observable<A>;
    pipe<A, B>(op1: any, op2: any): Observable<B>;
    pipe<A, B, C>(op1: any, op2: any, op3: any): Observable<C>;
    pipe<A, B, C, D>(op1: any, op2: any, op3: any, op4: any): Observable<D>;
    pipe<A, B, C, D, E>(op1: any, op2: any, op3: any, op4: any, op5: any): Observable<E>;
    pipe(...operations: any[]): Observable<any>;
  }
  
  export function of<T>(...values: T[]): Observable<T>;
}

declare module 'rxjs/operators' {
  export function tap<T>(observer?: any): any;
  export function map<T, R>(project: (value: T, index: number) => R): any;
}
