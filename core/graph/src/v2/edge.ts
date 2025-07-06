export interface Edge {
  readonly id: string;

  label?: string;

  source: string;
  target: string;

  weight?: number;

  condition?: string;

  events?: string[];
}