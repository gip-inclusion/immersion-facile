import { createRootSelector } from "src/core-logic/storeConfig/store";
import { createSelector } from "@reduxjs/toolkit";

const feedback = createRootSelector(
  (state) => state.establishmentBatch.feedback,
);

const candidateEstablishments = createRootSelector(
  (state) => state.establishmentBatch.candidateEstablishments,
);

const numberOfValidCandidateEstablishments = createSelector(
  candidateEstablishments,
  (candidateEstablishments) =>
    candidateEstablishments.filter(
      (candidateEstablishment) => candidateEstablishment.zodErrors.length === 0,
    ).length,
);

const numberOfInvalidCandidateEstablishments = createSelector(
  candidateEstablishments,
  (candidateEstablishments) =>
    candidateEstablishments.filter(
      (candidateEstablishment) => candidateEstablishment.zodErrors.length,
    ).length,
);

export const establishmentBatchSelectors = {
  feedback,
  candidateEstablishments,
  numberOfValidCandidateEstablishments,
  numberOfInvalidCandidateEstablishments,
};
