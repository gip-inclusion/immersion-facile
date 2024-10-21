import { toPairs } from "ramda";
import {
  ConventionDomainPayload,
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ForbiddenError,
  InclusionConnectJwtPayload,
  NotFoundError,
  WithConventionId,
  getIcUserRoleForAccessingConvention,
  stringToMd5,
  withConventionIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { conventionEmailsByRole } from "../../../utils/convention";
import { AgencyWithUsersRights } from "../../agency/ports/AgencyRepository";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getIcUserByUserId } from "../../inclusion-connected-users/helpers/inclusionConnectedUser.helper";

export class GetConvention extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload
> {
  protected inputSchema = withConventionIdSchema;

  protected async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    authPayload?: ConventionRelatedJwtPayload,
  ): Promise<ConventionReadDto> {
    if (!authPayload) {
      throw new ForbiddenError("No auth payload provided");
    }

    const convention =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!convention)
      throw new NotFoundError(`No convention found with id ${conventionId}`);

    const isConventionDomainPayload = "emailHash" in authPayload;
    const isInclusionConnectPayload = this.#isInclusionConnectPayload(
      authPayload,
      conventionId,
    );

    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new NotFoundError(`Agency ${convention.agencyId} not found`);
    }

    if (isConventionDomainPayload) {
      return this.#onConventionDomainPayload({
        authPayload,
        uow,
        convention,
        agency,
      });
    }

    if (isInclusionConnectPayload) {
      return this.#onInclusionConnectPayload({
        authPayload,
        uow,
        convention,
      });
    }

    throw new ForbiddenError("Incorrect jwt");
  }

  async #onConventionDomainPayload({
    authPayload,
    convention,
    agency,
    uow,
  }: {
    authPayload: ConventionDomainPayload;
    convention: ConventionReadDto;
    agency: AgencyWithUsersRights;
    uow: UnitOfWork;
  }): Promise<ConventionReadDto> {
    const matchingMd5Emails = await this.#isMatchingMd5Emails({
      authPayload,
      convention,
      agency,
      uow,
    });
    if (!matchingMd5Emails) {
      throw new ForbiddenError(
        `User has no right on convention '${convention.id}'`,
      );
    }

    return convention;
  }

  async #onInclusionConnectPayload({
    authPayload,
    convention,
    uow,
  }: {
    authPayload: InclusionConnectJwtPayload;
    convention: ConventionReadDto;
    uow: UnitOfWork;
  }): Promise<ConventionReadDto> {
    const roles = getIcUserRoleForAccessingConvention(
      convention,
      await getIcUserByUserId(uow, authPayload.userId),
    );

    if (!roles.length)
      throw new ForbiddenError(
        `User with id '${authPayload.userId}' is not allowed to access convention with id '${convention.id}'`,
      );

    return convention;
  }

  #isInclusionConnectPayload(
    authPayload: ConventionRelatedJwtPayload,
    conventionId: ConventionId,
  ): authPayload is InclusionConnectJwtPayload {
    if (!("role" in authPayload)) return true;
    if (authPayload.role === "back-office") return false;
    if (authPayload.applicationId === conventionId) return false;
    throw new ForbiddenError(
      `This token is not allowed to access convention with id ${conventionId}. Role was '${authPayload.role}'`,
    );
  }

  async #isMatchingMd5Emails({
    authPayload,
    convention,
    agency,
    uow,
  }: {
    authPayload: ConventionDomainPayload;
    convention: ConventionReadDto;
    agency: AgencyWithUsersRights;
    uow: UnitOfWork;
  }): Promise<boolean> {
    const emailsByRole = conventionEmailsByRole(
      convention,
      await agencyWithRightToAgencyDto(uow, agency),
    )[authPayload.role];
    if (emailsByRole instanceof Error) throw emailsByRole;
    const isEmailMatchingConventionEmails = !!emailsByRole.find(
      (email) => authPayload.emailHash === stringToMd5(email),
    );
    const isEmailMatchingIcUserEmails =
      await this.#isInclusionConnectedCounsellorOrValidator({
        authPayload,
        agencyWithRights: agency,
        uow,
      });
    const peAdvisorEmail =
      convention.signatories.beneficiary.federatedIdentity?.payload?.advisor
        .email;
    const isEmailMatchingPeAdvisor = peAdvisorEmail
      ? stringToMd5(peAdvisorEmail) === authPayload.emailHash
      : false;
    return (
      isEmailMatchingConventionEmails ||
      isEmailMatchingIcUserEmails ||
      isEmailMatchingPeAdvisor
    );
  }

  async #isInclusionConnectedCounsellorOrValidator({
    authPayload: { role, emailHash },
    agencyWithRights,
    uow,
  }: {
    authPayload: ConventionDomainPayload;
    agencyWithRights: AgencyWithUsersRights;
    uow: UnitOfWork;
  }) {
    if (role !== "counsellor" && role !== "validator") return false;

    const userIdsWithRoleOnAgency = toPairs(agencyWithRights.usersRights)
      .filter(([_, right]) => right?.roles.includes(role))
      .map(([id]) => id);

    const users = await uow.userRepository.getByIds(
      userIdsWithRoleOnAgency,
      await makeProvider(uow),
    );

    return users.some((user) => stringToMd5(user.email) === emailHash);
  }
}
