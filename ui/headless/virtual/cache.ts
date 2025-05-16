export interface VirtualCache {
  length: number;
  size: number;
}

export class Cache implements VirtualCache {
  public constructor(
    public readonly length: number,
    public readonly size: number
  ) { }
}