import { WithSiretDto, errors, withSiretSchema } from "shared";
import { locationToRawAddress } from "../../../../utils/address";
import { TransactionalUseCase } from "../../../core/UseCase";
import { makeProvider } from "../../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UserOnRepository } from "../../../core/authentication/inclusion-connect/port/UserRepository";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { EstablishmentAggregate } from "../../entities/EstablishmentAggregate";

export class NotifyConfirmationEstablishmentCreated extends TransactionalUseCase<WithSiretDto> {
  protected inputSchema = withSiretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { siret }: WithSiretDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishment) throw errors.establishment.notFound({ siret });

    const firstAdminUser = await getFirstAdminUser(uow, establishment);
    const establishmentContactUsers = await getEstablishmentContactUsers(
      uow,
      establishment,
    );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
        recipients: [firstAdminUser.email],
        cc: establishmentContactUsers.map((user) => user.email),
        params: {
          contactFirstName: firstAdminUser.firstName,
          contactLastName: firstAdminUser.lastName,
          businessName: establishment.establishment.name,
          businessAddresses: establishment.establishment.locations.map(
            ({ address, id }) => locationToRawAddress(id, address).rawAddress,
          ),
        },
      },
      followedIds: {
        establishmentSiret: establishment.establishment.siret,
      },
    });
  }
}

const getFirstAdminUser = async (
  uow: UnitOfWork,
  establishment: EstablishmentAggregate,
): Promise<UserOnRepository> => {
  const firstAdmin = establishment.userRights.find(
    (user) => user.role === "establishment-admin",
  );

  if (!firstAdmin)
    throw errors.establishment.adminNotFound({
      siret: establishment.establishment.siret,
    });

  const firstAdminUser = await uow.userRepository.getById(
    firstAdmin.userId,
    await makeProvider(uow),
  );

  if (!firstAdminUser)
    throw errors.user.notFound({ userId: firstAdmin.userId });
  return firstAdminUser;
};

const getEstablishmentContactUsers = async (
  uow: UnitOfWork,
  establishment: EstablishmentAggregate,
): Promise<UserOnRepository[]> => {
  const contactUserRights = establishment.userRights.filter(
    (user) => user.role === "establishment-contact",
  );

  return uow.userRepository.getByIds(
    contactUserRights.map((userRight) => userRight.userId),
    await makeProvider(uow),
  );
};
