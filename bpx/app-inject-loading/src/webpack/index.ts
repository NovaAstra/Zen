import { type Compiler, Compilation,sources } from "webpack"
import { readLoadingHtml, readPackageJSON } from "../common"

const PLUGIN_NAME = 'WebpackAppInjectLoadingPlugin';

export function WebpackAppInjectLoading(
  namespace: string = 'mspbots',
  template?: string
) {
  return {
    name: PLUGIN_NAME,
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
        compilation.hooks.processAssets.tapPromise(
          {
            name: PLUGIN_NAME,
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          async () => {
            const loadingHtml = await readLoadingHtml(template);
            if (!loadingHtml) return;

            const { version } = await readPackageJSON(process.cwd());
            const scope = process.env[`${namespace}_APP_NAMESPACE`] || namespace
            const env = process.env.NODE_ENV || 'development'
            const cacheName = `${scope}-${version}-${env}-preferences-theme`;

            const injectScript = `
              <script data-app-loading="inject-js">
                var theme = localStorage.getItem(${cacheName});
                document.documentElement.classList.toggle('dark', /dark/.test(theme));
              </script>
              `;

            const assetName = 'index.html';
            const assetSource = compilation.getAsset(assetName);
            if (!assetSource) {
              return;
            }

            let html = assetSource.source.source().toString();
            html = html.replace(/<body\s*>/, `<body>${injectScript}${loadingHtml}`);

            compilation.updateAsset(
              assetName,
              new sources.RawSource(html)
            );
          }
        )
      })
    }
  }
}