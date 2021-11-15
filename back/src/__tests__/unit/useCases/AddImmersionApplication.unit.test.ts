import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { AddImmersionApplication } from "../../../domain/immersionApplication/useCases/AddImmersionApplication";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { UseCase } from "../../../domain/core/UseCase";
import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "../../../shared/siret";

// Stub implementation for tests:

class StubGetSiret extends UseCase<GetSiretRequestDto, GetSiretResponseDto> {
  error: Error = new Error(
    "StubGetSiret not initialized, set error or response",
  );
  response: GetSiretResponseDto | null = {
    siret: "12345678901234",
    businessName: "TEST BUSINESS NAME",
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    naf: { code: "78.3Z", nomenclature: "Ref2" },
    isOpen: true,
  };

  inputSchema = getSiretRequestSchema;

  public async _execute({
    siret,
  }: GetSiretRequestDto): Promise<GetSiretResponseDto> {
    if (this.response) {
      return this.response;
    } else {
      throw this.error;
    }
  }
}

describe("Add immersionApplication", () => {
  let addImmersionApplication: AddImmersionApplication;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  const validImmersionApplication =
    new ImmersionApplicationDtoBuilder().build();
  let stubGetSiret = new StubGetSiret();

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    addImmersionApplication = createAddDemandeImmersionUseCase();
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      stubGetSiret,
    );
  };

  test("saves valid applications in the repository", async () => {
    const occurredAt = new Date("2021-10-15T15:00");
    const id = "eventId";
    clock.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);

    expect(
      await addImmersionApplication.execute(validImmersionApplication),
    ).toEqual({
      id: validImmersionApplication.id,
    });

    const storedInRepo = await applicationRepository.getAll();
    expect(storedInRepo.length).toBe(1);
    expect(storedInRepo[0].toDto()).toEqual(validImmersionApplication);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt: occurredAt.toISOString(),
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validImmersionApplication,
        wasPublished: false,
      },
    ]);
  });

  test("rejects applications where the ID is already in use", async () => {
    await applicationRepository.save(
      ImmersionApplicationEntity.create(validImmersionApplication),
    );

    await expectPromiseToFailWithError(
      addImmersionApplication.execute(validImmersionApplication),
      new ConflictError(validImmersionApplication.id),
    );
  });

  describe("SIRET validation", () => {
    let originalStubResponse = stubGetSiret.response;

    beforeAll(() => {
      originalStubResponse = stubGetSiret.response;
    });

    afterAll(() => {
      // Restore the original stub configuration to avoid leaking state to other tests
      stubGetSiret.response = originalStubResponse;
    });

    it("rejects applications with SIRETs that don't correspond to active businesses", async () => {
      stubGetSiret.response = {
        siret: validImmersionApplication.siret,
        businessName: "INACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: false,
      };

      await expectPromiseToFailWithError(
        addImmersionApplication.execute(validImmersionApplication),
        new BadRequestError(
          "Siret ne correspond pas à une siège active: " +
            validImmersionApplication.siret,
        ),
      );
    });

    it("accepts applications with SIRETs that  correspond to active businesses", async () => {
      stubGetSiret.response = {
        siret: validImmersionApplication.siret,
        businessName: "ACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: true,
      };

      expect(
        await addImmersionApplication.execute(validImmersionApplication),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      stubGetSiret.response = null;
      const error = new Error("test error");
      stubGetSiret.error = error;

      await expectPromiseToFailWithError(
        addImmersionApplication.execute(validImmersionApplication),
        error,
      );
    });
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(outboxRepository.events).toEqual(expected);
  };
});
