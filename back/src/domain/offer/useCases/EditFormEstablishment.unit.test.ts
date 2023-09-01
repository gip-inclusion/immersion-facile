import {
  BackOfficeDomainPayload,
  EstablishmentDomainPayload,
  EstablishmentJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { formEstablishementUpdateFailedErrorMessage } from "../ports/FormEstablishmentRepository";
import { EditFormEstablishment } from "../useCases/EditFormEstablishment";

describe("Edit Form Establishment", () => {
  let uow: InMemoryUnitOfWork;
  let useCase: EditFormEstablishment;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidGenerator;

  const formSiret = "12345678901234";
  const establishmentPayload: EstablishmentDomainPayload = { siret: formSiret };
  const backofficePayload: BackOfficeDomainPayload = {
    role: "backOffice",
    sub: "",
  };

  const existingFormEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(formSiret)
    .build();
  const updatedFormEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(formSiret)
    .withBusinessName("Edited Business Name")
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    useCase = new EditFormEstablishment(
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
        useCase.execute(updatedFormEstablishment, {
          siret: "bad-siret",
        } as EstablishmentJwtPayload),
        new ForbiddenError(),
      );
    });

    it("Forbidden error without jwt payload", async () => {
      await expectPromiseToFailWithError(
        useCase.execute(updatedFormEstablishment),
        new ForbiddenError(),
      );
    });

    it("conflict error when form does not exist", async () => {
      await expectPromiseToFailWithError(
        useCase.execute(updatedFormEstablishment, establishmentPayload),
        new ConflictError(
          formEstablishementUpdateFailedErrorMessage(updatedFormEstablishment),
        ),
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
      await useCase.execute(updatedFormEstablishment, establishmentPayload);

      // Assert
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          payload: updatedFormEstablishment,
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

    it("publish a FormEstablishmentEdited event & update formEstablishment on repository with a backoffice payload", async () => {
      // Prepare
      uow.formEstablishmentRepository.setFormEstablishments([
        existingFormEstablishment,
      ]);

      // Act
      await useCase.execute(updatedFormEstablishment, backofficePayload);

      // Assert
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          payload: updatedFormEstablishment,
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
