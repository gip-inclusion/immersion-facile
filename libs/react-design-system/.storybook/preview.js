import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

startReactDsfr({
  defaultColorScheme: "system",
});

export default {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};
