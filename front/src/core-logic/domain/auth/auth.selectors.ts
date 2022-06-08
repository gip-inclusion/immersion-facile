import { createRootSelector } from "src/core-logic/storeConfig/store";

const connectedWith = createRootSelector((state) => state.auth.connectedWith);

export const authSelectors = {
  connectedWith,
};
