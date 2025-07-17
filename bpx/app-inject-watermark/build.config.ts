import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/vite/index',
    'src/webpack/index',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    esbuild: {
      drop: [],
    }
  }
});