import {
  EstablishmentDomainPayload,
  FormEstablishmentDto,
  InclusionConnectDomainJwtPayload,
  WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { rawAddressToLocation } from "../../../utils/address";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import { createOrGetUserIdByEmail } from "../../core/authentication/inclusion-connect/entities/user.helper";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { TriggeredBy } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto,
  void,
  InclusionConnectDomainJwtPayload | EstablishmentDomainPayload
> {
  protected inputSchema = withFormEstablishmentSchema;

  readonly #addressGateway: AddressGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    addressAPI: AddressGateway,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#addressGateway = addressAPI;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
    jwtPayload: InclusionConnectDomainJwtPayload | EstablishmentDomainPayload,
  ): Promise<void> {
    if (!jwtPayload) throw errors.user.noJwtProvided();

    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw errors.establishment.notFound({
        siret: formEstablishment.siret,
      });

    const triggeredBy = await this.#getTriggeredBy(
      uow,
      jwtPayload,
      initialEstablishmentAggregate,
      formEstablishment,
    );

    return this.withAllowedRights(
      uow,
      formEstablishment,
      initialEstablishmentAggregate,
      triggeredBy,
    );
  }

  async #getTriggeredBy(
    uow: UnitOfWork,
    jwtPayload: EstablishmentDomainPayload | InclusionConnectDomainJwtPayload,
    establishmentAggregate: EstablishmentAggregate,
    formEstablishment: FormEstablishmentDto,
  ): Promise<TriggeredBy> {
    if ("siret" in jwtPayload) {
      if (jwtPayload.siret === formEstablishment.siret)
        return {
          kind: "establishment-magic-link",
          siret: formEstablishment.siret,
        };
      throw errors.establishment.siretMismatch();
    }

    const user = await uow.userRepository.getById(
      jwtPayload.userId,
      await makeProvider(uow),
    );
    if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

    if (
      establishmentAggregate.userRights.some(
        ({ userId }) => userId === user.id,
      ) ||
      user.isBackofficeAdmin
    )
      return {
        kind: "inclusion-connected",
        userId: user.id,
      };

    throw errors.user.forbidden({
      userId: user.id,
    });
  }

  private async withAllowedRights(
    uow: UnitOfWork,
    formEstablishment: FormEstablishmentDto,
    originalAggregate: EstablishmentAggregate,
    triggeredBy: TriggeredBy,
  ): Promise<void> {
    const adminUserId = await createOrGetUserIdByEmail(
      uow,
      this.#timeGateway,
      this.#uuidGenerator,
      {
        email: formEstablishment.businessContact.email,
        firstName: formEstablishment.businessContact.firstName,
        lastName: formEstablishment.businessContact.lastName,
      },
    );

    const contactUserIds = await Promise.all(
      formEstablishment.businessContact.copyEmails.map((email) =>
        createOrGetUserIdByEmail(uow, this.#timeGateway, this.#uuidGenerator, {
          email,
        }),
      ),
    );

    const updatedUserRights: EstablishmentUserRight[] = [
      {
        role: "establishment-admin",
        job: formEstablishment.businessContact.job,
        phone: formEstablishment.businessContact.phone,
        userId: adminUserId,
      },
      ...contactUserIds.map(
        (userId): EstablishmentUserRight => ({
          role: "establishment-contact",
          userId,
        }),
      ),
    ];

    const establishmentAggregate = makeEstablishmentAggregate({
      existingEntity: originalAggregate.establishment,
      timeGateway: this.#timeGateway,
      formEstablishment,
      // Rien touché mais étonnant qu'on maj pas le naf ni le nombre d'employés
      nafAndNumberOfEmployee: {
        nafDto: originalAggregate.establishment.nafDto,
        numberEmployeesRange:
          originalAggregate.establishment.numberEmployeesRange,
      },
      addressesAndPosition: await Promise.all(
        formEstablishment.businessAddresses.map(async (address) =>
          rawAddressToLocation(
            this.#addressGateway,
            formEstablishment.siret,
            address,
          ),
        ),
      ),
      score: originalAggregate.establishment.score,
      userRights: updatedUserRights,
    });

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregate,
      this.#timeGateway.now(),
    );

    return uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UpdatedEstablishmentAggregateInsertedFromForm",
        payload: {
          siret: establishmentAggregate.establishment.siret,
          triggeredBy,
        },
      }),
    );
  }
}
