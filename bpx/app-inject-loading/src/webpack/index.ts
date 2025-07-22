import { type Compiler, Compilation, sources } from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin";
import { readLoadingHtml, readPackageJSON } from "../common"

const PLUGIN_NAME = 'WebpackAppInjectLoadingPlugin';

export function WebpackAppInjectLoading(
  template: string = 'loading.html',
  namespace: string = 'zen',
) {
  return {
    name: PLUGIN_NAME,
    apply(compiler: Compiler) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
        const hook = HtmlWebpackPlugin.getHooks(compilation).beforeEmit;

        hook.tapPromise(PLUGIN_NAME,
          async (data) => {
            const loadingHtml = await readLoadingHtml(template);
            if (!loadingHtml) return data;

            const { version } = await readPackageJSON(process.cwd());
            const scope = process.env[`${namespace}_APP_NAMESPACE`] || namespace
            const env = process.env.NODE_ENV || 'development'
            const cacheName = `${scope}-${version}-${env}-preferences-theme`;

            const injectScript = `
              <script data-app-loading="inject-js">
                var theme = localStorage.getItem("${cacheName}");
                document.documentElement.classList.toggle('dark', /dark/.test(theme));
              </script>
              `;

            data.html = data.html.replace(/<body\s*>/, `<body>${injectScript}${loadingHtml}`);

            return data;
          }
        )
      })
    }
  }
}