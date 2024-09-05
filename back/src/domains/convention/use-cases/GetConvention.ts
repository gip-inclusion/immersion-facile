import {
  AgencyDto,
  AgencyId,
  ConventionDomainPayload,
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  InclusionConnectJwtPayload,
  WithConventionId,
  getIcUserRoleForAccessingConvention,
  stringToMd5,
  withConventionIdSchema,
} from "shared";
import { ForbiddenError, NotFoundError } from "shared";
import { conventionEmailsByRole } from "../../../utils/convention";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  OAuthGatewayProvider,
  oAuthModeByFeatureFlags,
} from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UserRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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

    const mode = oAuthModeByFeatureFlags(
      await uow.featureFlagRepository.getAll(),
    );

    if (isConventionDomainPayload) {
      return this.#onConventionDomainPayload({
        authPayload,
        uow,
        convention,
        mode,
      });
    }

    if (isInclusionConnectPayload) {
      return this.#onInclusionConnectPayload({
        authPayload,
        uow,
        convention,
        mode,
      });
    }

    throw new ForbiddenError("Incorrect jwt");
  }

  async #onConventionDomainPayload({
    authPayload,
    convention,
    uow,
    mode,
  }: {
    authPayload: ConventionDomainPayload;
    convention: ConventionReadDto;
    uow: UnitOfWork;
    mode: OAuthGatewayProvider;
  }): Promise<ConventionReadDto> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new NotFoundError(`Agency ${convention.agencyId} not found`);
    }
    const matchingMd5Emails = await this.#isMatchingMd5Emails({
      authPayload,
      convention,
      agency,
      userRepository: uow.userRepository,
      mode,
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
    mode,
  }: {
    authPayload: InclusionConnectJwtPayload;
    convention: ConventionReadDto;
    uow: UnitOfWork;
    mode: OAuthGatewayProvider;
  }): Promise<ConventionReadDto> {
    const user = await uow.userRepository.getById(authPayload.userId, mode);
    if (!user)
      throw new NotFoundError(`No user found with id '${authPayload.userId}'`);

    const roles = getIcUserRoleForAccessingConvention(convention, user);

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
    if (authPayload.role === "backOffice") return false;
    if (authPayload.applicationId === conventionId) return false;
    throw new ForbiddenError(
      `This token is not allowed to access convention with id ${conventionId}. Role was '${authPayload.role}'`,
    );
  }

  async #isMatchingMd5Emails({
    authPayload,
    convention,
    agency,
    userRepository,
    mode,
  }: {
    authPayload: ConventionDomainPayload;
    convention: ConventionReadDto;
    agency: AgencyDto;
    userRepository: UserRepository;
    mode: OAuthGatewayProvider;
  }): Promise<boolean> {
    const emailsByRole = conventionEmailsByRole(convention, agency)[
      authPayload.role
    ];
    if (emailsByRole instanceof Error) throw emailsByRole;
    const isEmailMatchingConventionEmails = !!emailsByRole.find(
      (email) => authPayload.emailHash === stringToMd5(email),
    );
    const isEmailMatchingIcUserEmails =
      await this.#isInclusionConnectedCounsellorOrValidator({
        authPayload,
        agencyId: agency.id,
        userRepository,
        mode,
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
    authPayload,
    userRepository,
    agencyId,
    mode,
  }: {
    authPayload: ConventionDomainPayload;
    userRepository: UserRepository;
    agencyId: AgencyId;
    mode: OAuthGatewayProvider;
  }) {
    if (authPayload.role !== "counsellor" && authPayload.role !== "validator")
      return false;

    const users = await userRepository.getWithFilter(
      {
        agencyRole: authPayload.role,
        agencyId,
      },
      mode,
    );

    return users.some(
      (user) => stringToMd5(user.email) === authPayload.emailHash,
    );
  }
}
