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

  private lastComputedOffsetIndex: number = -1;

  public constructor(
    public readonly length: number,
    public readonly defaultSize: number = ESTIMATED_SIZE,
    config: Partial<VirtualCacheChunkConfig> = {}
  ) { }

  public getItemSize(index: number): number {
    if (index < 0 || index >= this.length) return 0;
    const chunk = this.getChunk(index);
    return chunk.sizes.get(index) ?? this.defaultSize
  }

  public setItemSize(index: number, size: number) {
    const chunk = this.getChunk(index);

    chunk.sizes.set(index, size);
    chunk.lastUsedTime = Date.now();

    this.lastComputedOffsetIndex = Math.min(index, this.lastComputedOffsetIndex)
  }

  public calculateRange() { }

  public calculateTotalSize() {
    if (!this.length) return 0;
  }

  private findIndex(offset: number, low: number = 0, high: number = this.length - 1): number {
    if (this.length <= 0 || offset < 0) return 0;

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

  private calculateOffset(index: number) {
    if (this.length <= 0 || index < 0) return 0;
    if (index >= this.length) index = this.length - 1;

    const chunk = this.getChunk(index);

    if (chunk.offsets.has(index)) {
      return chunk.offsets.get(index)!;
    }

    let startIndex = Math.max(0, this.lastComputedOffsetIndex);
    let offset = startIndex >= 0 ? (chunk.offsets.get(startIndex) ?? 0) : 0;

    const step = index >= startIndex ? 1 : -1;
    const end = index + step;

    for (let i = startIndex; i !== end; i += step) {
      if (step === 1 && i >= this.length) break;
      if (step === -1 && i < 0) break;

      const size = this.getItemSize(i);
      if (step === 1) {
        chunk.offsets.set(i, offset);
        offset += size;
      } else {
        offset -= this.getItemSize(i - 1);
        chunk.offsets.set(i - 1, offset);
      }
    }

    this.lastComputedOffsetIndex = index;
    chunk.lastUsedTime = Date.now();
    return chunk.offsets.get(index) ?? offset;
  }

  private getChunk(index: number): VirtualCacheChunk {
    if (index < 0 || index >= this.length) {
      throw new Error(`Invalid index: ${index}, must be in [0, ${this.length - 1}]`);
    }

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