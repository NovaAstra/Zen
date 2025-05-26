import { ESTIMATED_SIZE } from "./constants"

export interface VirtualCache {
  length: number;
  defaultSize: number;
}

export interface VirtualCacheChunkConfig {
  chunkSize: number;
}

export interface VirtualCacheChunk {
  startIndex: number;
  endIndex: number;
  sizes: Map<number, number>;
  offsets: Map<number, number>;
  lastUsedTime: number;
}

export class Cache implements VirtualCache {
  private readonly config: VirtualCacheChunkConfig;

  private readonly chunks: Map<number, VirtualCacheChunk> = new Map();

  public constructor(
    public readonly length: number,
    public readonly defaultSize: number = ESTIMATED_SIZE
  ) { }

  public getItemSize(index: number): number {
    if (index < 0 || index >= this.length) return 0;
    const chunk = this.getChunk(index);
    return chunk.sizes.get(index) ?? this.defaultSize
  }

  public setItemSize(index: number, size: number): boolean {
    if (index < 0 || index >= this.length) return false;

    const chunk = this.getChunk(index);
    const isInitialMeasurement = !chunk.sizes.has(index);

    chunk.sizes.set(index, size);
    return isInitialMeasurement
  }

  public calculateRange() { }

  public calculateTotalSize() {
    if (!this.length) return 0;
  }

  private calculateOffset(index: number) {
    if (this.length <= 0 || index < 0) return 0;
    if (index >= this.length) index = this.length - 1;
    return 0
  }

  private findIndex(offset: number, low: number = 0, high: number = this.length - 1): number {
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const itemOffset = this.calculateOffset(middle);
      if (itemOffset <= offset) {
        if (itemOffset + this.getItemSize(middle) > offset) {
          return middle;
        }
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return Math.max(0, Math.min(this.length - 1, low));
  }

  private getChunk(index: number): VirtualCacheChunk {
    const chunkId = Math.floor(index / this.config.chunkSize);

    const chunk = this.chunks.get(chunkId);
    if (!chunk) {
      this.chunks.set(chunkId, {
        startIndex: chunkId * this.config.chunkSize,
        endIndex: Math.min((chunkId + 1) * this.config.chunkSize - 1, this.length - 1),
        sizes: new Map(),
        offsets: new Map(),
        lastUsedTime: Date.now(),
      })
    }

    return this.chunks.get(chunkId) as VirtualCacheChunk;
  }
}