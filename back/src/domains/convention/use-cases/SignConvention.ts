import {
  ConventionDomainPayload,
  ConventionDto,
  ConventionStatus,
  InclusionConnectDomainJwtPayload,
  Role,
  SignatoryRole,
  WithConventionId,
  WithConventionIdLegacy,
  allSignatoryRoles,
  signConventionDtoWithRole,
  withConventionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { DomainTopic } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfTransitionNotAllowed } from "../entities/Convention";

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ConventionPartiallySigned",
  IN_REVIEW: "ConventionFullySigned",
};

const isAllowedToSign = (role: Role): role is SignatoryRole =>
  allSignatoryRoles.includes(role as SignatoryRole);

export class SignConvention extends TransactionalUseCase<
  WithConventionId,
  WithConventionIdLegacy,
  ConventionDomainPayload | InclusionConnectDomainJwtPayload
> {
  protected inputSchema = withConventionIdSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    const initialConventionRead =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!initialConventionRead) throw new NotFoundError(conventionId);

    const role = await this.#getRole(jwtPayload, uow, initialConventionRead);

    if (!role || !isAllowedToSign(role))
      throw new ForbiddenError(
        "Only Beneficiary, his current employer, his legal representative or the establishment representative are allowed to sign convention",
      );

    const signedConvention = signConventionDtoWithRole(
      initialConventionRead,
      role,
      this.#timeGateway.now().toISOString(),
    );
    throwIfTransitionNotAllowed({
      roles: [role],
      targetStatus: signedConvention.status,
      conventionRead: initialConventionRead,
    });

    const signedId = await uow.conventionRepository.update(signedConvention);
    if (!signedId) throw new NotFoundError(signedId);

    const domainTopic = domainTopicByTargetStatusMap[signedConvention.status];
    if (domainTopic) {
      const event = this.#createNewEvent({
        topic: domainTopic,
        payload: { convention: signedConvention },
      });
      await uow.outboxRepository.save(event);
    }

    return { id: signedId };
  }

  async #getRole(
    jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
    uow: UnitOfWork,
    initialConvention: ConventionDto,
  ): Promise<Role | undefined> {
    if ("role" in jwtPayload) return jwtPayload.role;
    const icUser = await uow.inclusionConnectedUserRepository.getById(
      jwtPayload.userId,
    );
    return icUser?.email ===
      initialConvention.signatories.establishmentRepresentative.email
      ? initialConvention.signatories.establishmentRepresentative.role
      : undefined;
  }
}
