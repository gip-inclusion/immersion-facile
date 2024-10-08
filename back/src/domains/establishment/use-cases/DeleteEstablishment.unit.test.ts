import {
  FormEstablishmentDtoBuilder,
  GroupOptions,
  InclusionConnectedUserBuilder,
  addressDtoToString,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
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
import { DeleteEstablishment } from "./DeleteEstablishment";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .build();

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
    uow.userRepository.setInclusionConnectedUsers([backofficeAdminUser]);
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
        errors.user.unauthorized(),
      );
    });

    it("Throws not found error on missing establishment aggregate", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: establishmentAggregate.establishment.siret,
          },
          backofficeAdminUser,
        ),
        errors.establishment.notFound({
          siret: establishmentAggregate.establishment.siret,
        }),
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
          backofficeAdminUser,
        ),
        errors.establishment.notFound({
          siret: formEstablishment.siret,
        }),
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
        backofficeAdminUser,
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
