import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const establishmentState = (state: RootState) => state.establishment;

const sendModifyLinkSucceeded = createSelector(
  establishmentState,
  (establishment) => establishment.feedback.kind === "success",
);

const isReadyForLinkRequestOrRedirection = createSelector(
  establishmentState,
  (establishment) =>
    establishment.feedback.kind === "readyForLinkRequestOrRedirection",
);

const sendModifyLinkFeedback = createSelector(
  establishmentState,
  (establishment) => establishment.feedback,
);

export const establishmentSelectors = {
  sendModifyLinkSucceeded,
  sendModifyLinkFeedback,
  isReadyForLinkRequestOrRedirection,
};
