import {
  AgencyRole,
  ConventionDto,
  ConventionId,
  ConventionRelatedJwtPayload,
  RenewConventionParams,
  Role,
  clearSignaturesAndValidationDate,
  errorMessages,
  renewConventionParamsSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { AddConvention } from "./AddConvention";

export class RenewConvention extends TransactionalUseCase<
  RenewConventionParams,
  void,
  ConventionRelatedJwtPayload
> {
  protected inputSchema = renewConventionParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private addConvention: AddConvention,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { dateEnd, dateStart, id, renewed, schedule }: RenewConventionParams,
    uow: UnitOfWork,
    jwtPayload?: ConventionRelatedJwtPayload,
  ): Promise<void> {
    const allowedRoles: Role[] = ["validator", "counsellor", "backOffice"];

    if (!jwtPayload) throw new UnauthorizedError();

    const conventionInRepo = await uow.conventionRepository.getById(
      renewed.from,
    );
    if (!conventionInRepo)
      throw new NotFoundError(
        errorMessages.convention.notFound({
          conventionId: renewed.from,
        }),
      );

    const roles = await this.#rolesByPayload(
      jwtPayload,
      uow,
      conventionInRepo,
      renewed.from,
    );

    if (!allowedRoles.some((allowedRole) => roles.includes(allowedRole)))
      throw new ForbiddenError(
        `The role '${roles}' is not allowed to renew convention`,
      );

    if (conventionInRepo.status !== "ACCEPTED_BY_VALIDATOR")
      throw new BadRequestError(
        `This convention cannot be renewed, as it has status : '${conventionInRepo.status}'`,
      );

    //Ohh boy
    //TODO : should use event instead of sub usecase execution
    await this.addConvention.execute({
      convention: {
        ...clearSignaturesAndValidationDate(conventionInRepo),
        id,
        dateStart,
        dateEnd,
        schedule,
        renewed,
        status: "READY_TO_SIGN",
      },
    });
  }

  async #rolesByPayload(
    jwtPayload: ConventionRelatedJwtPayload,
    uow: UnitOfWork,
    convention: ConventionDto,
    from: ConventionId,
  ): Promise<(Role | AgencyRole)[]> {
    if ("role" in jwtPayload) {
      if (from !== jwtPayload.applicationId)
        throw new ForbiddenError(
          "This token is not allowed to renew this convention",
        );
      return [jwtPayload.role];
    }

    const inclusionConnectedUser =
      await uow.inclusionConnectedUserRepository.getById(jwtPayload.userId);
    if (!inclusionConnectedUser)
      throw new NotFoundError(
        `Inclusion connected user '${jwtPayload.userId}' not found.`,
      );

    if (inclusionConnectedUser.isBackofficeAdmin) return ["backOffice"];

    const agencyRight = inclusionConnectedUser.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === convention.agencyId,
    );

    if (!agencyRight)
      throw new ForbiddenError(
        `You don't have sufficient rights on agency '${convention.agencyId}'.`,
      );

    return agencyRight.roles;
  }
}
