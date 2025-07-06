const { defineConfig } = require('@vue/cli-service')
const path = require('path')

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
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    cache: {
      type: 'filesystem'
    }
  },
  chainWebpack(config) {
    if (config.plugins.has('preload')) {
      // it can improve the speed of the first screen, it is recommended to turn on preload
      config.plugin('preload').tap(() => [
        {
          rel: 'preload',
          // to ignore runtime.js
          // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
          fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
          include: 'initial'
        }
      ])
    }

    // when there are many pages, it will cause too many meaningless requests
    config.plugins.delete('prefetch')

    config
      .optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial' // only package third parties that are initially dependent
          },
          elementUI: {
            name: 'chunk-elementUI', // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
          },
          components: {
            name: 'chunk-components',
            test: resolve('src/components'),
            minChunks: 3,
            priority: 5,
            reuseExistingChunk: true
          },
          materials: {
            name: 'chunk-materials',
            test: resolve('src/materials'),
            minChunks: 3,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
    // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
    config.optimization.runtimeChunk('single')
  }
})
