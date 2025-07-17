import { type Compiler, Compilation, sources } from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin";

const PLUGIN_NAME = 'WebpackAppInjectWatermarkPlugin';

export function WebpackAppInjectWatermarkPlugin(
  template: string = 'loading.html',
  namespace: string = 'zen',
) {
  return {
    name: PLUGIN_NAME,
    apply(compiler: Compiler) {
      
    }
  }
}