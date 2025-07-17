import { type Compiler, Compilation, sources } from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin";
import { type WatermarkPluginOptions } from "../type"
import { resolveEnabled, resolveText, createSVG, createWatermarkStyle } from "../common"

const PLUGIN_NAME = 'WebpackAppInjectWatermarkPlugin';

const DEFAULT_OPTIONS: WatermarkPluginOptions = {
  text: 'Watermark',
  fontSize: 24,
  color: 'rgba(0,0,0,0.1)',
  rotate: -30,
  width: 200,
  height: 200,
  enabled: true
};

export function WebpackAppInjectWatermark(options: Partial<WatermarkPluginOptions> = {}) {
  return {
    name: PLUGIN_NAME,
    apply(compiler: Compiler) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
        const hook = HtmlWebpackPlugin.getHooks(compilation).beforeEmit;

        hook.tapPromise(PLUGIN_NAME,
          async (data) => {
            const env = process.env;
            if (!resolveEnabled(options.enabled, env)) return data;

            const text = resolveText(options.text, env);
            const svg = createSVG({
              ...DEFAULT_OPTIONS,
              ...options,
              text
            });

            const base64 = Buffer.from(svg).toString('base64');
            const style = createWatermarkStyle(base64);

            const html = `<div id="fullpage-watermark" style="${style}"></div>`;

            data.html = data.html.replace(/<body\s*>/, `<body>${html}`);

            return data;
          })
      })
    }
  }
}