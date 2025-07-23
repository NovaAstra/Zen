import { type Preview, setup } from '@storybook/vue3'
import { themes } from '@storybook/theming'

setup((app) => {

})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      dark: {
        ...themes.dark
      },
      light: {
        ...themes.light
      },
    },
  },
};

export default preview;