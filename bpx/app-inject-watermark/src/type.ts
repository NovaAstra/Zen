export type Text =
  | string
  | ((env: NodeJS.ProcessEnv) => string);

export type Enabled = boolean | ((env: NodeJS.ProcessEnv) => boolean);

export interface WatermarkPluginOptions {
  text: Text;
  fontSize: number;
  color: string;
  rotate: number;
  width: number;
  height: number;
  enabled: Enabled;
}