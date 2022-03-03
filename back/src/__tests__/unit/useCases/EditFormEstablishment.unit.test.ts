import { createInMemoryUow } from "../../../adapters/primary/config";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

const prepareUseCase = () => {
  const formEstablishmentRepo = new InMemoryFormEstablishmentRepository();
  const outboxRepo = new InMemoryOutboxRepository();
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    outboxRepo,
    formEstablishmentRepo,
  });
  const clock = new CustomClock();
  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const useCase = new EditFormEstablishment(uowPerformer, createNewEvent);

  return { useCase, clock, outboxRepo, formEstablishmentRepo };
};
describe("Edit Form Establishment", () => {
  describe("If establishment form id already exists", () => {
    const formSiret = "12345678901234";
    const existingDto: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid().withSiret(formSiret).build();
    const updatedDto: FormEstablishmentDto = {
      ...existingDto,
      businessName: "Edited Business Name",
    };
    it("should publish an event", async () => {
      // Prepare
      const { useCase, formEstablishmentRepo, outboxRepo } = prepareUseCase();
      await formEstablishmentRepo.create(existingDto);

      // Act
      await useCase.execute(updatedDto);

      // Assert
      expect(outboxRepo.events).toHaveLength(1);
      const expectedEventTopic: DomainTopic = "FormEstablishmentEdited";
      expect(outboxRepo.events[0].topic).toEqual(expectedEventTopic);
      expect(outboxRepo.events[0].payload).toEqual(updatedDto);
    });
    it("should update the establishment form in repository", async () => {
      // Prepare
      const { useCase, formEstablishmentRepo } = prepareUseCase();
      await formEstablishmentRepo.create(existingDto);

      // Act
      await useCase.execute(updatedDto);

      // Assert
      expect(await formEstablishmentRepo.getBySiret(formSiret)).toEqual(
        updatedDto,
      );
    });
  });

  describe("If establishment form id does not exist", () => {
    it("should throw a conflict error", async () => {
      const { useCase } = prepareUseCase();
      expectPromiseToFailWithError(
        useCase.execute(FormEstablishmentDtoBuilder.valid().build()),
        new ConflictError(""),
      );
    });
  });
});
