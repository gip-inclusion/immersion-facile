import { toPairs } from "ramda";
import {
  type AgencyId,
  type AgencyWithUsersRights,
  type Beneficiary,
  type ConventionDto,
  type ConventionReadDto,
  type ConventionRole,
  type Email,
  type EmailHash,
  errors,
  type Role,
  type UserWithAdminRights,
} from "shared";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { agencyWithRightToAgencyDto } from "./agency";
import { conventionEmailsByRole } from "./convention";
import { isSomeEmailMatchingEmailHash, makeEmailHash } from "./jwt";

export const isHashMatchNotNotifiedCounsellorOrValidator = async ({
  role,
  emailHash,
  agency,
  uow,
}: {
  role: Role;
  emailHash: EmailHash;
  agency: AgencyWithUsersRights;
  uow: UnitOfWork;
}): Promise<boolean> => {
  if (role !== "counsellor" && role !== "validator") return false;

  const userIdsWithRoleOnAgency = toPairs(agency.usersRights)
    .filter(
      ([_, right]) => right?.roles.includes(role) && !right.isNotifiedByEmail,
    )
    .map(([id]) => id);

  const users = await uow.userRepository.getByIds(userIdsWithRoleOnAgency);

  return isSomeEmailMatchingEmailHash(
    users.map(({ email }) => email),
    emailHash,
  );
};

export const getAgencyEmailFromEmailHash = async (
  uow: UnitOfWork,
  agencyId: AgencyId,
  emailHash: string,
): Promise<Email> => {
  const agencyWithRights = await uow.agencyRepository.getById(agencyId);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

  const agencyEmails = [...agency.validatorEmails, ...agency.counsellorEmails];

  const email = agencyEmails.find(
    (agencyEmail) => makeEmailHash(agencyEmail) === emailHash,
  );

  if (!email) throw errors.agency.emailNotFound({ agencyId });

  return email;
};

export const isHashMatchConventionEmails = async ({
  convention,
  emailHash,
  role,
}: {
  convention: ConventionReadDto;
  emailHash: EmailHash;
  role: ConventionRole;
}) => {
  const emailsByRole = conventionEmailsByRole(convention)(role);
  return isSomeEmailMatchingEmailHash(emailsByRole, emailHash);
};

export const isHashMatchPeAdvisorEmail = ({
  beneficiary,
  emailHash,
}: {
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">;
  emailHash: EmailHash;
}) => {
  const peAdvisorEmail = beneficiary.federatedIdentity?.payload?.advisor?.email;

  return peAdvisorEmail
    ? isSomeEmailMatchingEmailHash([peAdvisorEmail], emailHash)
    : false;
};

export const makeHashByRolesForTest = (
  convention: ConventionDto,
  counsellor: UserWithAdminRights,
  validator: UserWithAdminRights,
): Record<Role, string> => ({
  "agency-admin": "N/A",
  "agency-viewer": "N/A",
  "back-office": "N/A",
  "beneficiary-current-employer": makeEmailHash(
    convention.signatories.beneficiaryCurrentEmployer?.email ?? "N/A",
  ),
  "beneficiary-representative": makeEmailHash(
    convention.signatories.beneficiaryRepresentative?.email ?? "N/A",
  ),
  "establishment-representative": makeEmailHash(
    convention.signatories.establishmentRepresentative.email,
  ),
  "to-review": "N/A",
  beneficiary: makeEmailHash(convention.signatories.beneficiary.email),
  "establishment-tutor": makeEmailHash(convention.establishmentTutor.email),
  counsellor: makeEmailHash(counsellor.email ?? "N/A"),
  validator: makeEmailHash(validator.email),
  "establishment-admin": "N/A",
  "establishment-contact": "N/A",
});
