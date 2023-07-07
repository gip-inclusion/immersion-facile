import { createRootSelector } from "src/core-logic/storeConfig/store";

const sendLinkSucceeded = createRootSelector(
  (state) => state.establishment.status === "LINK_SENT",
);

const isReadyForLinkRequestOrRedirection = createRootSelector(
  (state) =>
    state.establishment.status === "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
);

const sendLinkFeedback = createRootSelector(
  (state) => state.establishment.feedback,
);

export const establishmentSelectors = {
  sendLinkSucceeded,
  sendLinkFeedback,
  isReadyForLinkRequestOrRedirection,
};
