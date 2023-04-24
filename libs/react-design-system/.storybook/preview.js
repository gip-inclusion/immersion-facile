import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

startReactDsfr({
  defaultColorScheme: "system",
});

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
