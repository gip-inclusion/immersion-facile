import { AgencyDto } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

export const agencyAdminSelector = ({ agencyAdmin }: RootState) => agencyAdmin;

export const agencyAdminDetailsSelector = ({
  agencyAdmin,
}: RootState): AgencyDto | null => agencyAdmin.agency;
