import { createRootSelector } from "src/core-logic/storeConfig/store";

const federatedIdentity = createRootSelector(
  (state) => state.auth.federatedIdentity,
);

export const authSelectors = {
  federatedIdentity,
};
