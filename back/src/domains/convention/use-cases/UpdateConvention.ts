import {
  ConventionDomainPayload,
  ConventionDto,
  ConventionStatus,
  InclusionConnectDomainJwtPayload,
  UpdateConventionRequestDto,
  WithConventionIdLegacy,
  errorMessages,
  updateConventionRequestSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { TriggeredBy } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfIcUserNotBackofficeAdmin } from "../../inclusion-connected-users/helpers/throwIfIcUserNotBackofficeAdmin";

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
      throw new ForbiddenError(
        `Convention ${convention.id} with modifications should have status ${minimalValidStatus}`,
      );

    const conventionFromRepo = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!conventionFromRepo)
      throw new NotFoundError(
        errorMessages.convention.notFound({ conventionId: convention.id }),
      );

    if (conventionFromRepo.status !== "DRAFT") {
      throw new BadRequestError(
        `Convention ${conventionFromRepo.id} cannot be modified as it has status ${conventionFromRepo.status}`,
      );
    }

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
  if (!jwtPayload) throw new UnauthorizedError();

  if ("userId" in jwtPayload)
    return throwIfIcUserNotBackofficeAdmin(uow, jwtPayload);

  if ("applicationId" in jwtPayload) {
    if (jwtPayload.applicationId !== convention.id)
      throw new ForbiddenError(
        `User is not allowed to update convention ${convention.id}`,
      );
    return;
  }

  throw new UnauthorizedError();
};
