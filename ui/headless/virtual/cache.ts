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
  sizes: number[];
  offsets: number[];
  lastUsedTime: number;
}

export class Cache implements VirtualCache {
  private readonly config: VirtualCacheChunkConfig;

  private readonly chunks: Map<number, VirtualCacheChunk> = new Map();

  private lastCalculatedOffsetIndex: number = -1;

  public constructor(
    public readonly length: number,
    public readonly defaultSize: number = ESTIMATED_SIZE,
    config: Partial<VirtualCacheChunkConfig> = {}
  ) { }

  public getItemSize(index: number) {
    if (index < 0 || index >= this.length) return 0;
    const chunk = this.getChunk(index);
    return chunk.sizes[index - chunk.startIndex] ?? this.defaultSize;
  }

  public setItemSize(index: number, size: number) {
    if (index < 0 || index >= this.length) return false;

    const chunk = this.getChunk(index);
    const localIndex = index - chunk.startIndex
    const isInitialMeasurement = chunk.sizes[localIndex] === undefined;
    chunk.sizes[localIndex] = size;
    this.lastCalculatedOffsetIndex = Math.min(index, this.lastCalculatedOffsetIndex)
    return isInitialMeasurement;
  }

  public calculateRange() { }

  public calculateTotalSize() {
    if (!this.length) return 0;
  }

  private findIndex(offset: number, low: number = 0, high: number = this.length - 1) {
    if (this.length <= 0 || offset < 0) return 0;

  }

  private calculateOffset(index: number) {
    if (this.length <= 0 || index < 0) return 0;
    if (index >= this.length) index = this.length - 1;
  }

  private getChunk(index: number) {
    const chunkIndex = Math.floor(index / this.config.chunkSize);
    let chunk = this.chunks.get(chunkIndex);
    if (!chunk) {
      this.chunks.set(chunkIndex, chunk = {
        startIndex: chunkIndex * this.config.chunkSize,
        endIndex: (chunkIndex + 1) * this.config.chunkSize - 1,
        sizes: new Array(this.config.chunkSize),
        offsets: new Array(this.config.chunkSize),
        lastUsedTime: Date.now(),
      })
    }

    return chunk;
  }
}