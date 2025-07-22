const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const { EsbuildPlugin } = require('esbuild-loader')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const { WebpackAppInjectLoading } = require('@zen-bpx/app-inject-loading/webpack');
const { WebpackAppInjectWatermark } = require('@zen-bpx/app-inject-watermark/webpack');

const resolve = (dir) => path.join(__dirname, dir)

module.exports = defineConfig({
  lintOnSave: process.env.NODE_ENV === 'development',
  transpileDependencies: true,
  productionSourceMap: false,
  css: {
    loaderOptions: {
      sass: {

      }
    }
  },

  chainWebpack(config) {
    config.resolve.alias
      .set('@', resolve('src'))

    config.plugins.delete('prefetch')
    if (config.plugins.has('preload')) {
      config.plugin('preload').tap(() => [
        {
          rel: 'preload',
          fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
          include: 'initial'
        }
      ])
    }

    const rule = config.module.rule('js')
    rule.uses.clear()
    rule.use('esbuild-loader').loader('esbuild-loader').options({
      loader: 'js',
      target: 'chrome90'
    })

    config.optimization.minimizers.delete('terser')
    config.optimization
      .minimizer('esbuild')
      .use(EsbuildPlugin, [{
        minify: true,
        target: 'chrome90',
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true
      }])

    config.module
      .rule('vue-jsx')
      .test(/\.jsx?$/)
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        plugins: ['@vue/babel-plugin-transform-vue-jsx'],
      })
      .end();

    config.module.rule("svg").uses.clear()
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    config
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map'))



    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config.plugin('compression-webpack-plugin')
            .use(CompressionWebpackPlugin, [{
              test: /\.(js|css|html|svg)$/,
              threshold: 10240,
              deleteOriginalAssets: false
            }])

          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial'
                },
                elementUI: {
                  name: 'chunk-elementUI',
                  priority: 20,
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/
                },

              }
            })
          config.optimization.runtimeChunk('single')
        })
  },
  configureWebpack(config) {
    config.plugins.push(
      WebpackAppInjectLoading(),
      WebpackAppInjectWatermark(),
    )

    config.cache = {
      type: 'filesystem',
      allowCollectingMemory: true
    }
  },
})
