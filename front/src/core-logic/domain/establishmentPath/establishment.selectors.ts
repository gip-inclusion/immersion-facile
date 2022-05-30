import { createRootSelector } from "src/core-logic/storeConfig/store";

const wasModifyLinkSentSelector = createRootSelector(
  (state) => state.establishment.status === "LINK_SENT",
);

export const establishmentSelectors = {
  wasModifyLinkSent: wasModifyLinkSentSelector,
};
