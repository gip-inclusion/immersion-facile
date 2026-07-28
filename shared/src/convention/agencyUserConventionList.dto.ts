import type { BusinessName } from "../establishment/establishment.dto";
import type { FtConnectIdentity } from "../federatedIdentities/federatedIdentity.dto";
import type { Firstname, Lastname } from "../user/user.dto";
import type { DateString } from "../utils/date";
import type {
  ConventionAssessmentFields,
  ConventionId,
  ConventionStatus,
  WithOptionalFirstnameAndLastname,
} from "./convention.dto";

export type AgencyUserConventionListDto = {
  id: ConventionId;
  status: ConventionStatus;
  dateStart: DateString;
  dateEnd: DateString;
  businessName: BusinessName;
  agencyName: string;
  agencyReferent?: WithOptionalFirstnameAndLastname;
  assessment: ConventionAssessmentFields["assessment"];
  beneficiary: {
    firstName: Firstname;
    lastName: Lastname;
    federatedIdentity?: FtConnectIdentity;
  };
};
