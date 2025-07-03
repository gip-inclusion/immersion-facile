import { toPairs } from "ramda";
import {
  type AgencyId,
  type AgencyRole,
  type AgencyUsersRights,
  type AgencyWithUsersRights,
  type CreateAgencyDto,
  createAgencySchema,
  errors,
  type UserId,
} from "shared";
import { createOrGetUserIdByEmail } from "../../core/authentication/connected-user/entities/user.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { throwConflictErrorOnSimilarAgencyFound } from "../entities/Agency";

type WithUserIdAndIsNotified = {
  userId: UserId;
  isNotifiedByEmail: boolean;
};

export class AddAgency extends TransactionalUseCase<CreateAgencyDto, void> {
  protected inputSchema = createAgencySchema;

  readonly #createNewEvent: CreateNewEvent;
  readonly #siretGateway: SiretGateway;
  readonly #timeGateway: TimeGateway;
  readonly #uuidGenerator: UuidGenerator;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    siretGateway: SiretGateway,
    timeGateway: TimeGateway,
    uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#siretGateway = siretGateway;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  protected async _execute(
    { validatorEmails, counsellorEmails, ...rest }: CreateAgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const validatorUserIdsForAgency: WithUserIdAndIsNotified[] =
      rest.refersToAgencyId
        ? await this.#getReferredAgencyValidatorUserIds(
            uow,
            rest.refersToAgencyId,
          )
        : await Promise.all(
            validatorEmails.map(async (email) => ({
              userId: await createOrGetUserIdByEmail(
                uow,
                this.#timeGateway,
                this.#uuidGenerator,
                { email },
              ),
              isNotifiedByEmail: true,
            })),
          );

    const counsellorUserIdsForAgency: WithUserIdAndIsNotified[] =
      await Promise.all(
        counsellorEmails.map(async (email) => ({
          userId: await createOrGetUserIdByEmail(
            uow,
            this.#timeGateway,
            this.#uuidGenerator,
            { email },
          ),
          isNotifiedByEmail: true,
        })),
      );

    const agency: AgencyWithUsersRights = {
      ...rest,
      status: "needsReview",
      codeSafir: null,
      rejectionJustification: null,
      usersRights: this.#makeUserRights(
        validatorUserIdsForAgency,
        counsellorUserIdsForAgency,
      ),
    };

    await throwConflictErrorOnSimilarAgencyFound({ uow, agency });

    const siretEstablishmentDto =
      agency.agencySiret &&
      (await this.#siretGateway.getEstablishmentBySiret(agency.agencySiret));

    if (!siretEstablishmentDto)
      throw errors.agency.invalidSiret({ siret: agency.agencySiret });

    await Promise.all([
      uow.agencyRepository.insert(agency),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "NewAgencyAdded",
          payload: { agencyId: agency.id, triggeredBy: null },
        }),
      ),
    ]);
  }

  #makeUserRights(
    validatorUsersForAgency: WithUserIdAndIsNotified[],
    counsellorUsersForAgency: WithUserIdAndIsNotified[],
  ): AgencyUsersRights {
    const validatorsAndCounsellors = validatorUsersForAgency.filter(
      ({ userId }) =>
        counsellorUsersForAgency.map(({ userId }) => userId).includes(userId),
    );
    const validators = validatorUsersForAgency.filter(
      ({ userId }) =>
        !validatorsAndCounsellors.map(({ userId }) => userId).includes(userId),
    );
    const counsellors = counsellorUsersForAgency.filter(
      ({ userId }) =>
        !validatorsAndCounsellors.map(({ userId }) => userId).includes(userId),
    );

    return {
      ...buildAgencyUsersRights(validatorsAndCounsellors, [
        "validator",
        "counsellor",
      ]),
      ...buildAgencyUsersRights(validators, ["validator"]),
      ...buildAgencyUsersRights(counsellors, ["counsellor"]),
    };
  }

  async #getReferredAgencyValidatorUserIds(
    uow: UnitOfWork,
    refersToAgencyId: AgencyId,
  ): Promise<WithUserIdAndIsNotified[]> {
    const referredAgency = await uow.agencyRepository.getById(refersToAgencyId);
    if (!referredAgency)
      throw errors.agency.notFound({ agencyId: refersToAgencyId });
    return toPairs(referredAgency.usersRights)
      .filter(([_, right]) => right?.roles.includes("validator"))
      .map(([userId, right]) => ({
        userId,
        isNotifiedByEmail: right?.isNotifiedByEmail ?? true,
      }));
  }
}
const buildAgencyUsersRights = (
  userIdsBothValidatorAndCounsellor: WithUserIdAndIsNotified[],
  roles: AgencyRole[],
): AgencyUsersRights =>
  userIdsBothValidatorAndCounsellor.reduce<AgencyUsersRights>(
    (acc, { userId, isNotifiedByEmail }) => ({
      ...acc,
      [userId]: {
        roles,
        isNotifiedByEmail,
      },
    }),
    {},
  );
