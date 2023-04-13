import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const feedback = createRootSelector(
  (state) => state.establishmentBatch.feedback,
);

const candidateEstablishments = createRootSelector(
  (state) => state.establishmentBatch.candidateEstablishments,
);

const isLoading = createRootSelector(
  (state) => state.establishmentBatch.isLoading,
);

const addBatchResponse = createRootSelector(
  (state) => state.establishmentBatch.addBatchResponse,
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
  isLoading,
  addBatchResponse,
};
