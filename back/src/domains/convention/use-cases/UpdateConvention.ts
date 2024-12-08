import {
  ConventionDomainPayload,
  ConventionDto,
  ConventionStatus,
  InclusionConnectDomainJwtPayload,
  UpdateConventionRequestDto,
  WithConventionIdLegacy,
  errors,
  updateConventionRequestSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { TriggeredBy } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfIcUserNotBackofficeAdmin } from "../../inclusion-connected-users/helpers/authorization.helper";

export class UpdateConvention extends TransactionalUseCase<
  UpdateConventionRequestDto,
  WithConventionIdLegacy,
  ConventionDomainPayload | InclusionConnectDomainJwtPayload
> {
  protected inputSchema = updateConventionRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { convention }: UpdateConventionRequestDto,
    uow: UnitOfWork,
    jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    await throwIfNotAllowed(uow, convention, jwtPayload);

    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (convention.status !== minimalValidStatus)
      throw errors.convention.updateBadStatusInParams({ id: convention.id });

    const conventionFromRepo = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!conventionFromRepo)
      throw errors.convention.notFound({ conventionId: convention.id });

    if (conventionFromRepo.status !== "DRAFT")
      throw errors.convention.updateBadStatusInRepo({
        id: conventionFromRepo.id,
      });

    const triggeredBy: TriggeredBy =
      "userId" in jwtPayload
        ? {
            kind: "inclusion-connected",
            userId: jwtPayload.userId,
          }
        : {
            kind: "convention-magic-link",
            role: jwtPayload.role,
          };

    await Promise.all([
      uow.conventionRepository.update(convention),
      uow.outboxRepository.save(
        this.createNewEvent({
          topic: "ConventionSubmittedAfterModification",
          payload: { convention, triggeredBy },
        }),
      ),
    ]);

    return { id: conventionFromRepo.id };
  }
}

const throwIfNotAllowed = async (
  uow: UnitOfWork,
  convention: ConventionDto,
  jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
) => {
  if (!jwtPayload) throw errors.user.unauthorized();

  if ("userId" in jwtPayload)
    return throwIfIcUserNotBackofficeAdmin(uow, jwtPayload);

  if ("applicationId" in jwtPayload) {
    if (jwtPayload.applicationId !== convention.id)
      throw errors.convention.updateForbidden({ id: convention.id });
    return;
  }

  throw errors.user.unauthorized();
};
