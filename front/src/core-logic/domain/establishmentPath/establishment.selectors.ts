import { createRootSelector } from "src/core-logic/storeConfig/store";

export const modifyEstablishmentLinkSentSelector = createRootSelector(
  (state) => state.establishment.linkSent,
);
