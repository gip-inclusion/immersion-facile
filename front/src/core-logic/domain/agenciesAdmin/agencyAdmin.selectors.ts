import { AgencyDto } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

const agencyState = ({ agencyAdmin }: RootState) => agencyAdmin;

const agency = ({ agencyAdmin }: RootState): AgencyDto | null =>
  agencyAdmin.agency;

export const agencyAdminSelectors = {
  agency,
  agencyState,
};
