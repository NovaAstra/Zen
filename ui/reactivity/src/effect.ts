export interface EffectOptions { }

export class Effect {
  public constructor(options: EffectOptions) { }

  public notify() { }

  public dispose() { }
}

export function effect(options: EffectOptions): Effect {
  return new Effect(options)
}