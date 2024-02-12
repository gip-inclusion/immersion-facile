import { RootState } from "src/core-logic/storeConfig/store";

export const establishmentLeadErrorSelector = (state: RootState) =>
  state.establishmentLead.error;

export const establishmentLeadStatus = (state: RootState) =>
  state.establishmentLead.status;
