import { type WatermarkPluginOptions } from "./type";

export function resolveOption<T, P>(option: T | ((param: P) => T), param: P): T {
  if (typeof option === 'function') {
    // @ts-ignore
    return option(param);
  }
  return option;
}

export function resolveText(
  textOption: string | ((env: NodeJS.ProcessEnv) => string),
  env: NodeJS.ProcessEnv
): string {
  const text = resolveOption(textOption, env);
  if (typeof text === 'string') return text;
  return env.NODE_ENV;
}

export function resolveEnabled(
  enabledOption: boolean | ((env: NodeJS.ProcessEnv) => boolean) | undefined,
  env: NodeJS.ProcessEnv
): boolean {
  if (enabledOption === undefined) return true;
  return resolveOption(enabledOption, env);
}

export function createSVG({ text, fontSize, color, rotate, width, height }: WatermarkPluginOptions) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <text 
              x="50%" y="50%" dy=".35em" text-anchor="middle"
              fill="${color}"
              font-size="${fontSize}"
              transform="rotate(${rotate}, ${width / 2}, ${height / 2})"
              font-family="sans-serif"
            >
              ${text}
            </text>
          </svg>
        `;
}

export function createCSS(style: Record<string, string | number>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
    .join(';');
}

export function createWatermarkStyle(base64: string) {
  return createCSS({
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    backgroundImage: `url('data:image/svg+xml;base64,${base64}')`,
    backgroundRepeat: 'repeat',
    zIndex: '9999',
    opacity: '1',
  });
}