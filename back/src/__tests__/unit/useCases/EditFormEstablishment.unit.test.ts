import { FormEstablishmentDto } from "shared";
import { FormEstablishmentDtoBuilder } from "shared";
import { EstablishmentJwtPayload } from "shared";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const formEstablishmentRepository = uow.formEstablishmentRepository;
  const outboxRepository = uow.outboxRepository;
  const uowPerformer = new InMemoryUowPerformer(uow);
  const clock = new CustomClock();
  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const useCase = new EditFormEstablishment(uowPerformer, createNewEvent);

  return {
    useCase,
    clock,
    outboxRepository,
    formEstablishmentRepository,
  };
};
describe("Edit Form Establishment", () => {
  describe("Siret in JWT Payload does not match siret in edited establishment DTO", () => {
    it("Throws forbidden error", async () => {
      const { useCase } = prepareUseCase();
      const siretInJwtPayload = "11111111111111";
      const siretInFormEstablishment = "22222222222222";
      await expectPromiseToFailWithError(
        useCase.execute(
          FormEstablishmentDtoBuilder.valid()
            .withSiret(siretInFormEstablishment)
            .build(),
          { siret: siretInJwtPayload } as EstablishmentJwtPayload,
        ),
        new ForbiddenError(),
      );
    });
  });
  describe("Siret in JWT Payload matches siret in edited establishment DTO", () => {
    const formSiret = "12345678901234";
    const payload = { siret: formSiret } as EstablishmentJwtPayload;

    describe("If establishment form id already exists", () => {
      const existingDto: FormEstablishmentDto =
        FormEstablishmentDtoBuilder.valid().withSiret(formSiret).build();
      const updatedDto: FormEstablishmentDto = {
        ...existingDto,
        businessName: "Edited Business Name",
      };

      it("should publish an event", async () => {
        // Prepare
        const { useCase, formEstablishmentRepository, outboxRepository } =
          prepareUseCase();
        await formEstablishmentRepository.create(existingDto);

        // Act
        await useCase.execute(updatedDto, payload);

        // Assert
        expect(outboxRepository.events).toHaveLength(1);
        const expectedEventTopic: DomainTopic = "FormEstablishmentEdited";
        expect(outboxRepository.events[0].topic).toEqual(expectedEventTopic);
        expect(outboxRepository.events[0].payload).toEqual(updatedDto);
      });
      it("should update the establishment form in repository", async () => {
        // Prepare
        const { useCase, formEstablishmentRepository } = prepareUseCase();
        await formEstablishmentRepository.create(existingDto);

        // Act
        await useCase.execute(updatedDto, payload);

        // Assert
        expect(await formEstablishmentRepository.getBySiret(formSiret)).toEqual(
          updatedDto,
        );
      });
    });
    describe("If establishment form id does not exist", () => {
      it("should throw a conflict error", async () => {
        const { useCase } = prepareUseCase();
        await expectPromiseToFailWithError(
          useCase.execute(
            FormEstablishmentDtoBuilder.valid().withSiret(formSiret).build(),
            payload,
          ),
          new ConflictError(
            "Cannot update form establishlment DTO with siret 12345678901234, since it is not in list.",
          ),
        );
      });
    });
  });
});
