import { toPairs } from "ramda";
import {
  AgencyId,
  AgencyWithUsersRights,
  ConventionDomainPayload,
  ConventionDto,
  ConventionReadDto,
  Email,
  Role,
  UserWithAdminRights,
  errors,
  isSomeEmailMatchingEmailHash,
  makeEmailHash,
} from "shared";
import { makeProvider } from "../domains/core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { agencyWithRightToAgencyDto } from "./agency";
import { conventionEmailsByRole } from "./convention";

export const isHashMatchNotNotifiedCounsellorOrValidator = async ({
  authPayload: { role, emailHash },
  agency,
  uow,
}: {
  authPayload: ConventionDomainPayload;
  agency: AgencyWithUsersRights;
  uow: UnitOfWork;
}): Promise<boolean> => {
  if (role !== "counsellor" && role !== "validator") return false;

  const userIdsWithRoleOnAgency = toPairs(agency.usersRights)
    .filter(
      ([_, right]) => right?.roles.includes(role) && !right.isNotifiedByEmail,
    )
    .map(([id]) => id);

  const users = await uow.userRepository.getByIds(
    userIdsWithRoleOnAgency,
    await makeProvider(uow),
  );

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
  authPayload,
}: {
  convention: ConventionReadDto;
  uow: UnitOfWork;
  agency: AgencyWithUsersRights;
  authPayload: ConventionDomainPayload;
}) => {
  const emailsByRole = conventionEmailsByRole(
    convention,
    await agencyWithRightToAgencyDto(uow, agency),
  )[authPayload.role];

  if (emailsByRole instanceof Error) throw emailsByRole;
  return isSomeEmailMatchingEmailHash(emailsByRole, authPayload.emailHash);
};

export const isHashMatchPeAdvisorEmail = ({
  convention,
  authPayload,
}: { convention: ConventionReadDto; authPayload: ConventionDomainPayload }) => {
  const peAdvisorEmail =
    convention.signatories.beneficiary.federatedIdentity?.payload?.advisor
      .email;

  return peAdvisorEmail
    ? isSomeEmailMatchingEmailHash([peAdvisorEmail], authPayload.emailHash)
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
