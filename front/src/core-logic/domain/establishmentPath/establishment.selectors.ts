import { createRootSelector } from "src/core-logic/storeConfig/store";

const wasModifyLinkSent = createRootSelector(
  (state) => state.establishment.status === "LINK_SENT",
);

const isReadyForLinkRequestOrRedirection = createRootSelector(
  (state) =>
    state.establishment.status === "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
);

export const establishmentSelectors = {
  wasModifyLinkSent,
  isReadyForLinkRequestOrRedirection,
};
