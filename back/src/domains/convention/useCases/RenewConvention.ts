import {
  ConventionDto,
  ConventionId,
  ConventionRelatedJwtPayload,
  RenewConventionParams,
  Role,
  clearSignaturesAndValidationDate,
  renewConventionParamsSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
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
      throw new NotFoundError(`Convention with id '${renewed.from}' not found`);

    const role = await this.#roleByPayload(
      jwtPayload,
      uow,
      conventionInRepo,
      renewed.from,
    );

    if (!allowedRoles.includes(role))
      throw new ForbiddenError(
        `The role '${role}' is not allowed to renew convention`,
      );

    if (conventionInRepo.status !== "ACCEPTED_BY_VALIDATOR")
      throw new BadRequestError(
        `This convention cannot be renewed, as it has status : '${conventionInRepo.status}'`,
      );

    //Ohh boy
    //TODO : should use event instead of sub usecase execution
    await this.addConvention.execute({
      ...clearSignaturesAndValidationDate(conventionInRepo),
      id,
      dateStart,
      dateEnd,
      schedule,
      renewed,
      status: "READY_TO_SIGN",
    });
  }

  async #roleByPayload(
    jwtPayload: ConventionRelatedJwtPayload,
    uow: UnitOfWork,
    convention: ConventionDto,
    from: ConventionId,
  ): Promise<Role> {
    if ("role" in jwtPayload) {
      if (jwtPayload.role !== "backOffice" && from !== jwtPayload.applicationId)
        throw new ForbiddenError(
          "This token is not allowed to renew this convention",
        );
      return jwtPayload.role;
    }

    const inclusionConnectedUser =
      await uow.inclusionConnectedUserRepository.getById(jwtPayload.userId);
    if (!inclusionConnectedUser)
      throw new NotFoundError(
        `Inclusion connected user '${jwtPayload.userId}' not found.`,
      );

    const agencyRights = inclusionConnectedUser.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === convention.agencyId,
    );
    if (
      !agencyRights ||
      agencyRights.role === "agencyOwner" ||
      agencyRights.role === "toReview"
    )
      throw new ForbiddenError(
        `You don't have suffisiant rights on agency '${convention.agencyId}'.`,
      );
    return agencyRights.role;
  }
}
