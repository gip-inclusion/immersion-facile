import { createRootSelector } from "src/core-logic/storeConfig/store";

const feedback = createRootSelector(
  (state) => state.establishmentBatch.feedback,
);

export const establishmentBatchSelectors = {
  feedback,
};
