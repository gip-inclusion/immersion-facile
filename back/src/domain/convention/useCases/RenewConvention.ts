import {
  BackOfficeJwtPayload,
  clearSignaturesAndValidationDate,
  ConventionDomainPayload,
  RenewConventionParams,
  renewConventionParamsSchema,
  Role,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddConvention } from "./AddConvention";

export class RenewConvention extends TransactionalUseCase<
  RenewConventionParams,
  void,
  ConventionDomainPayload | BackOfficeJwtPayload
> {
  protected inputSchema = renewConventionParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private addConvention: AddConvention,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: RenewConventionParams,
    uow: UnitOfWork,
    jwtPayload?: ConventionDomainPayload | BackOfficeJwtPayload,
  ): Promise<void> {
    const allowedRoles: Role[] = ["validator", "counsellor", "backOffice"];

    if (!jwtPayload) throw new UnauthorizedError();
    if (!allowedRoles.includes(jwtPayload.role))
      throw new ForbiddenError(
        `The role '${jwtPayload.role}' is not allowed to renew convention`,
      );

    if (
      jwtPayload.role !== "backOffice" &&
      params.renewed.from !== jwtPayload.applicationId
    )
      throw new ForbiddenError(
        "This token is not allowed to renew this convention",
      );

    const conventionInRepo = await uow.conventionRepository.getById(
      params.renewed.from,
    );
    if (!conventionInRepo)
      throw new NotFoundError(
        `Convention with id '${params.renewed.from}' not found`,
      );

    if (conventionInRepo.status !== "ACCEPTED_BY_VALIDATOR")
      throw new BadRequestError(
        `This convention cannot be renewed, as it has status : '${conventionInRepo.status}'`,
      );
    await this.addConvention.execute({
      ...clearSignaturesAndValidationDate(conventionInRepo),
      ...params,
      status: "READY_TO_SIGN",
    });
  }
}
