import { Role } from "../tokens/MagicLinkPayload";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "./ImmersionApplication.dto";

const getNewStatus = (
  enterpriseAccepted: boolean,
  beneficiaryAccepted: boolean,
): ApplicationStatus => {
  if (enterpriseAccepted && beneficiaryAccepted) return "IN_REVIEW";
  if (
    (enterpriseAccepted && !beneficiaryAccepted) ||
    (!enterpriseAccepted && beneficiaryAccepted)
  )
    return "PARTIALLY_SIGNED";
  return "READY_TO_SIGN";
};

// Returns an application signed by provided roles.
export const signApplicationDtoWithRole = (
  application: ImmersionApplicationDto,
  role: Role,
): ImmersionApplicationDto => {
  if (
    !["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(application.status)
  ) {
    throw new Error(
      "Incorrect initial application status: " + application.status,
    );
  }

  const enterpriseAccepted =
    role === "establishment" ? true : application.enterpriseAccepted;
  const beneficiaryAccepted =
    role === "beneficiary" ? true : application.beneficiaryAccepted;

  const status = getNewStatus(enterpriseAccepted, beneficiaryAccepted);

  return {
    ...application,
    beneficiaryAccepted,
    enterpriseAccepted,
    status,
  };
};
