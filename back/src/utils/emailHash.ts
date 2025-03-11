import { toPairs } from "ramda";
import {
  type AgencyId,
  type AgencyWithUsersRights,
  type ConventionDto,
  type ConventionReadDto,
  type Email,
  type EmailHash,
  type Role,
  type UserWithAdminRights,
  errors,
  isSomeEmailMatchingEmailHash,
  makeEmailHash,
} from "shared";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { agencyWithRightToAgencyDto } from "./agency";
import { conventionEmailsByRole } from "./convention";

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
  uow,
  agency,
  emailHash,
  role,
}: {
  convention: ConventionReadDto;
  uow: UnitOfWork;
  agency: AgencyWithUsersRights;
  emailHash: EmailHash;
  role: Role;
}) => {
  const emailsByRole = conventionEmailsByRole(
    convention,
    await agencyWithRightToAgencyDto(uow, agency),
  )[role];

  if (emailsByRole instanceof Error) throw emailsByRole;
  return isSomeEmailMatchingEmailHash(emailsByRole, emailHash);
};

export const isHashMatchPeAdvisorEmail = ({
  convention,
  emailHash,
}: { convention: ConventionReadDto; emailHash: EmailHash }) => {
  const peAdvisorEmail =
    convention.signatories.beneficiary.federatedIdentity?.payload?.advisor
      .email;

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
});
