import {
  addressDtoToString,
  BackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  FormEstablishmentDtoBuilder,
  GroupOptions,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { EstablishmentAggregateBuilder } from "../../../adapters/secondary/offer/InMemoryEstablishmentAggregateRepository";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { ContactEntity } from "../entities/ContactEntity";
import { establishmentNotFoundErrorMessage } from "../ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../ports/FormEstablishmentRepository";
import { DeleteEstablishment } from "./DeleteEstablishment";

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
  const backofficeJwtPayload: BackOfficeJwtPayload = {
    role: "backOffice",
    sub: "admin",
    exp: 2,
    iat: 1,
    version: 1,
  };

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
        new ForbiddenError("Accès refusé"),
      );
    });

    it("Throws not found error on missing establishment aggregate", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: establishmentAggregate.establishment.siret,
          },
          backofficeJwtPayload,
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
          backofficeJwtPayload,
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
        backofficeJwtPayload,
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
              businessAddress: addressDtoToString(
                establishmentAggregate.establishment.address,
              ),
            },
            cc: contact.copyEmails,
          },
        ],
      });
    });
  });
});
