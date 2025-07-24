export enum ZapLevel {
  NONE = -1,
  ERROR,
  WARN,
  INFO,
  VERBOSE,
  DEBUG,
  SILLY
}

export interface ZapOptions {

}

export class Zap {
  public constructor(options: ZapOptions) { }
}