import {
  AgencyWithUsersRights,
  ConventionDomainPayload,
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ForbiddenError,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  NotFoundError,
  WithConventionId,
  errors,
  getIcUserRoleForAccessingConvention,
  withConventionIdSchema,
} from "shared";
import {
  isHashMatchConventionEmails,
  isHashMatchNotNotifiedCounsellorOrValidator,
  isHashMatchPeAdvisorEmail,
} from "../../../utils/emailHash";
import { TransactionalUseCase } from "../../core/UseCase";
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
        user: await getIcUserByUserId(uow, authPayload.userId),
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
    const isMatchingEmailHash = await this.#isEmailHashMatch({
      authPayload,
      convention,
      agency,
      uow,
    });
    if (!isMatchingEmailHash) {
      throw errors.convention.forbiddenMissingRights({
        conventionId: convention.id,
      });
    }

    return convention;
  }

  async #onInclusionConnectPayload({
    user,
    convention,
    uow,
  }: {
    user: InclusionConnectedUser;
    convention: ConventionReadDto;
    uow: UnitOfWork;
  }): Promise<ConventionReadDto> {
    const roles = getIcUserRoleForAccessingConvention(convention, user);

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        convention.siret,
      );

    const hasSomeEstablishmentRights = establishment?.userRights.some(
      (userRight) => userRight.userId === user.id,
    );

    if (roles.length || hasSomeEstablishmentRights) return convention;

    throw new ForbiddenError(
      `User with id '${user.id}' is not allowed to access convention with id '${convention.id}'`,
    );
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

  async #isEmailHashMatch({
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
    const isMatchingConventionEmails = await isHashMatchConventionEmails({
      convention,
      uow,
      agency,
      authPayload,
    });
    const isEmailMatchingIcUserEmails =
      await isHashMatchNotNotifiedCounsellorOrValidator({
        authPayload,
        agency,
        uow,
      });
    const isEmailMatchingPeAdvisor = isHashMatchPeAdvisorEmail({
      convention,
      authPayload,
    });
    return (
      isMatchingConventionEmails ||
      isEmailMatchingIcUserEmails ||
      isEmailMatchingPeAdvisor
    );
  }
}
