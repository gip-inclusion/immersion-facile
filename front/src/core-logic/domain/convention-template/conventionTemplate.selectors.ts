import { createSelector } from "@reduxjs/toolkit";
import type { ConventionTemplateId } from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionTemplateState = (state: RootState) => state.conventionTemplate;

const isLoading = createSelector(
  conventionTemplateState,
  ({ isLoading }) => isLoading,
);

const conventionTemplates = createSelector(
  conventionTemplateState,
  ({ conventionTemplates }) => conventionTemplates,
);

const getConventionTemplateById = (
  conventionTemplateId?: ConventionTemplateId,
) =>
  createSelector(conventionTemplateState, ({ conventionTemplates }) =>
    conventionTemplateId
      ? conventionTemplates.find(
          (conventionTemplate) =>
            conventionTemplate.id === conventionTemplateId,
        )
      : undefined,
  );

export const conventionTemplateSelectors = {
  isLoading,
  conventionTemplates,
  getConventionTemplateById,
};
