import {
  EstablishmentDomainPayload,
  EstablishmentJwtPayload,
  FormEstablishmentDtoBuilder,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { EditFormEstablishment } from "./EditFormEstablishment";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .build();

const inclusionConnectedUser = new InclusionConnectedUserBuilder()
  .withId("inclusion-connected-user")
  .withIsAdmin(false)
  .build();

describe("Edit Form Establishment", () => {
  let uow: InMemoryUnitOfWork;
  let editFormEstablishment: EditFormEstablishment;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidGenerator;

  const inclusionConnectJwtPayload: InclusionConnectDomainJwtPayload = {
    userId: inclusionConnectedUser.id,
  };

  const formSiret = "12345678901234";
  const establishmentPayload: EstablishmentDomainPayload = {
    siret: formSiret,
  };

  const existingFormEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(formSiret)
    .build();
  const updatedFormEstablishment = FormEstablishmentDtoBuilder.fullyUpdated()
    .withSiret(formSiret)
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.userRepository.setInclusionConnectedUsers([backofficeAdminUser]);
    editFormEstablishment = new EditFormEstablishment(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
    );
  });

  describe("Wrong paths", () => {
    it("Forbidden error on EstablishmentJwtPayload with bad siret", async () => {
      await expectPromiseToFailWithError(
        editFormEstablishment.execute(updatedFormEstablishment, {
          siret: "bad-siret",
        } as EstablishmentJwtPayload),
        errors.establishment.siretMismatch(),
      );
    });

    it("Not found error if user is not found", async () => {
      await expectPromiseToFailWithError(
        editFormEstablishment.execute(
          updatedFormEstablishment,
          inclusionConnectJwtPayload,
        ),
        errors.user.notFound({ userId: inclusionConnectJwtPayload.userId }),
      );
    });

    it("Forbidden error on InclusionConnectJwtPayload with ic user that doesn't have rights on establishment", async () => {
      uow.userRepository.setInclusionConnectedUsers([inclusionConnectedUser]);
      await expectPromiseToFailWithError(
        editFormEstablishment.execute(
          updatedFormEstablishment,
          inclusionConnectJwtPayload,
        ),
        errors.user.forbidden({ userId: inclusionConnectedUser.id }),
      );
    });

    it("Forbidden error without jwt payload", async () => {
      await expectPromiseToFailWithError(
        editFormEstablishment.execute(updatedFormEstablishment),
        errors.user.noJwtProvided(),
      );
    });

    it("conflict error when form does not exist", async () => {
      await expectPromiseToFailWithError(
        editFormEstablishment.execute(
          updatedFormEstablishment,
          establishmentPayload,
        ),
        errors.establishment.conflictError({
          siret: establishmentPayload.siret,
        }),
      );
    });
  });

  describe("Right paths", () => {
    it("publish a FormEstablishmentEdited event & update formEstablishment on repository with an establishment payload", async () => {
      // Prepare
      uow.formEstablishmentRepository.setFormEstablishments([
        existingFormEstablishment,
      ]);

      // Act
      await editFormEstablishment.execute(
        updatedFormEstablishment,
        establishmentPayload,
      );

      // Assert
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          payload: {
            formEstablishment: updatedFormEstablishment,
            triggeredBy: {
              kind: "establishment-magic-link",
              siret: establishmentPayload.siret,
            },
          },
          status: "never-published",
          publications: [],
          topic: "FormEstablishmentEdited",
          wasQuarantined: false,
        },
      ]);
      expectToEqual(
        await uow.formEstablishmentRepository.getBySiret(formSiret),
        updatedFormEstablishment,
      );
    });

    it("publish a FormEstablishmentEdited event & update formEstablishment on repository with a IC payload with user with backoffice rights", async () => {
      // Prepare
      uow.formEstablishmentRepository.setFormEstablishments([
        existingFormEstablishment,
      ]);

      uow.userRepository.setInclusionConnectedUsers([backofficeAdminUser]);

      // Act
      await editFormEstablishment.execute(updatedFormEstablishment, {
        userId: backofficeAdminUser.id,
      });

      // Assert
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          payload: {
            formEstablishment: updatedFormEstablishment,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: backofficeAdminUser.id,
            },
          },
          status: "never-published",
          publications: [],
          topic: "FormEstablishmentEdited",
          wasQuarantined: false,
        },
      ]);
      expectToEqual(
        await uow.formEstablishmentRepository.getBySiret(formSiret),
        updatedFormEstablishment,
      );
    });
  });
});
