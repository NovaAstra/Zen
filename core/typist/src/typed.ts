export type Typed =
  | 'Null'
  | 'Undefined'
  | 'NaN'
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Symbol'
  | 'BigInt'
  | 'Function'
  | 'Promise'
  | 'Array'
  | 'Object'
  | 'Date'
  | 'Map'
  | 'Set'
  | 'WeakMap'
  | 'WeakSet'
  | 'RegExp'
  | 'Arguments'
  | 'Error'
  | string

export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array