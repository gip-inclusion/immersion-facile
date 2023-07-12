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

const feedback = createSelector(
  establishmentState,
  (establishment) => establishment.feedback,
);

const isLoading = createSelector(
  establishmentState,
  (establishment) => establishment.isLoading,
);

const formEstablishment = createSelector(
  establishmentState,
  (establishment) => establishment.formEstablishment,
);

export const establishmentSelectors = {
  sendModifyLinkSucceeded,
  formEstablishment,
  feedback,
  isLoading,
  isReadyForLinkRequestOrRedirection,
};
