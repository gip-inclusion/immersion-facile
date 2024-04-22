import {
  FormEstablishmentDtoBuilder,
  GroupOptions,
  InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  addressDtoToString,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { ContactEntity } from "../entities/ContactEntity";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { establishmentNotFoundErrorMessage } from "../ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../ports/FormEstablishmentRepository";
import { DeleteEstablishment } from "./DeleteEstablishment";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .build();

const backofficeAdminJwtPayload = {
  userId: backofficeAdminUser.id,
} as InclusionConnectJwtPayload;

const groupOptions: GroupOptions = {
  heroHeader: {
    title: "My hero header title",
    description: "My hero header description",
    logoUrl: "https://my-logo-url.com",
    backgroundColor: "blue",
  },
  tintColor: "red",
};

describe("Delete Establishment", () => {
  const contact: ContactEntity = {
    copyEmails: ["billy1@mail.com", "billy2@mail.com"],
    contactMethod: "EMAIL",
    email: "boss@mail.com",
    firstName: "",
    id: "",
    job: "",
    lastName: "",
    phone: "",
  };
  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withContact(contact)
    .build();
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(establishmentAggregate.establishment.siret)
    .build();

  let deleteEstablishment: DeleteEstablishment;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    deleteEstablishment = new DeleteEstablishment(
      new InMemoryUowPerformer(uow),
      timeGateway,
      makeSaveNotificationAndRelatedEvent(new TestUuidGenerator(), timeGateway),
    );
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
    ]);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  describe("Wrong paths", () => {
    it("Throws forbidden error on missing backoffice jwt", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute({
          siret: establishmentAggregate.establishment.siret,
        }),
        new ForbiddenError("Jwt payload not provided"),
      );
    });

    it("Throws not found error on missing establishment aggregate", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: establishmentAggregate.establishment.siret,
          },
          backofficeAdminJwtPayload,
        ),
        new NotFoundError(
          establishmentNotFoundErrorMessage(
            establishmentAggregate.establishment.siret,
          ),
        ),
      );
    });

    it("Throws not found error on missing form establishment", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: formEstablishment.siret,
          },
          backofficeAdminJwtPayload,
        ),
        new NotFoundError(
          formEstablishmentNotFoundErrorMessage(formEstablishment.siret),
        ),
      );
    });
  });

  describe("Right paths", () => {
    it("Establishment aggregate and form establishment are deleted, establishment group with siret have siret removed", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      uow.formEstablishmentRepository.setFormEstablishments([
        formEstablishment,
      ]);
      uow.groupRepository.groupEntities = [
        {
          name: "group",
          sirets: [formEstablishment.siret, "siret2"],
          slug: "group",
          options: groupOptions,
        },
      ];

      await deleteEstablishment.execute(
        {
          siret: establishmentAggregate.establishment.siret,
        },
        backofficeAdminJwtPayload,
      );

      expectToEqual(
        uow.establishmentAggregateRepository.establishmentAggregates,
        [],
      );
      expectToEqual(await uow.formEstablishmentRepository.getAll(), []);
      expectToEqual(uow.groupRepository.groupEntities, [
        {
          name: "group",
          sirets: ["siret2"],
          slug: "group",
          options: groupOptions,
        },
      ]);
      expectToEqual(uow.deletedEstablishmentRepository.deletedEstablishments, [
        {
          siret: establishmentAggregate.establishment.siret,
          createdAt: establishmentAggregate.establishment.createdAt,
          deletedAt: timeGateway.now(),
        },
      ]);
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_DELETED",
            recipients: [contact.email],
            params: {
              businessName: establishmentAggregate.establishment.name,
              siret: establishmentAggregate.establishment.siret,
              businessAddresses:
                establishmentAggregate.establishment.locations.map(
                  (addressAndPosition) =>
                    addressDtoToString(addressAndPosition.address),
                ),
            },
            cc: contact.copyEmails,
          },
        ],
      });
    });
  });
});
