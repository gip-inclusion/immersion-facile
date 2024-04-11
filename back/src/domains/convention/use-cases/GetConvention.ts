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
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { conventionEmailsByRole } from "../../../utils/convention";
import { TransactionalUseCase } from "../../core/UseCase";
import { InclusionConnectedUserRepository } from "../../core/dashboard/port/InclusionConnectedUserRepository";
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
    const isInclusionConnectPayload = this.#isInclusionConnectPayload(
      authPayload,
      conventionId,
    );

    const convention =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!convention)
      throw new NotFoundError(`No convention found with id ${conventionId}`);

    const isConventionDomainPayload = authPayload && "emailHash" in authPayload;
    if (isConventionDomainPayload) {
      const agency = await uow.agencyRepository.getById(convention.agencyId);
      if (!agency) {
        throw new NotFoundError(`Agency ${convention.agencyId} not found`);
      }
      const matchingMd5Emails = await this.#isMatchingMd5Emails({
        authPayload,
        convention,
        agency,
        inclusionConnectedUserRepository: uow.inclusionConnectedUserRepository,
      });
      if (!matchingMd5Emails) {
        throw new ForbiddenError(
          `User has no right on convention '${convention.id}'`,
        );
      }
    }

    if (isInclusionConnectPayload) {
      const user = await uow.inclusionConnectedUserRepository.getById(
        authPayload.userId,
      );
      if (!user)
        throw new NotFoundError(
          `No user found with id '${authPayload.userId}'`,
        );

      const role = getIcUserRoleForAccessingConvention(convention, user);

      if (!role)
        throw new ForbiddenError(
          `User with id '${authPayload.userId}' is not allowed to access convention with id '${conventionId}'`,
        );
    }

    return convention;
  }

  #isInclusionConnectPayload(
    authPayload: ConventionRelatedJwtPayload | undefined,
    conventionId: ConventionId,
  ): authPayload is InclusionConnectJwtPayload {
    if (!authPayload) throw new ForbiddenError("No auth payload provided");
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
    inclusionConnectedUserRepository,
  }: {
    authPayload: ConventionDomainPayload;
    convention: ConventionReadDto;
    agency: AgencyDto;
    inclusionConnectedUserRepository: InclusionConnectedUserRepository;
  }): Promise<boolean> {
    const emailsByRole = conventionEmailsByRole(
      authPayload.role,
      convention,
      agency,
    )[authPayload.role];
    if (emailsByRole instanceof Error) throw emailsByRole;
    const isEmailMatchingConventionEmails = !!emailsByRole.find(
      (email) => authPayload.emailHash === stringToMd5(email),
    );
    const isEmailMatchingIcUserEmails =
      await this.#isInclusionConnectedCounsellorOrValidator({
        authPayload,
        agencyId: agency.id,
        inclusionConnectedUserRepository,
      });
    return isEmailMatchingConventionEmails || isEmailMatchingIcUserEmails;
  }

  async #isInclusionConnectedCounsellorOrValidator({
    authPayload,
    inclusionConnectedUserRepository,
    agencyId,
  }: {
    authPayload: ConventionDomainPayload;
    inclusionConnectedUserRepository: InclusionConnectedUserRepository;
    agencyId: AgencyId;
  }) {
    if (authPayload.role !== "counsellor" && authPayload.role !== "validator")
      return false;

    const users = await inclusionConnectedUserRepository.getWithFilter({
      agencyRole: authPayload.role,
      agencyId,
    });

    return users.some(
      (user) => stringToMd5(user.email) === authPayload.emailHash,
    );
  }
}
