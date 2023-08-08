import {
  addressDtoToString,
  BackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
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
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { ContactEntity } from "../entities/ContactEntity";
import { establishmentNotFoundErrorMessage } from "../ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../ports/FormEstablishmentRepository";
import { DeleteEstablishment } from "./DeleteEstablishment";

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
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    deleteEstablishment = new DeleteEstablishment(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new TestUuidGenerator(),
        new CustomTimeGateway(),
      ),
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
      uow.establishmentGroupRepository.groups = [
        {
          name: "group",
          sirets: [formEstablishment.siret, "siret2"],
          slug: "group",
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
      expectToEqual(await uow.establishmentGroupRepository.groups, [
        {
          name: "group",
          sirets: ["siret2"],
          slug: "group",
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
