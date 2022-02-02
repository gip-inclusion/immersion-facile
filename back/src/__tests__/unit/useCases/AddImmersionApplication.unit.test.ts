import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
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
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { FeatureFlags } from "../../../shared/featureFlags";
import { validApplicationStatus } from "../../../shared/ImmersionApplicationDto";

describe("Add immersionApplication", () => {
  let addImmersionApplication: AddImmersionApplication;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  const validImmersionApplication =
    new ImmersionApplicationDtoBuilder().build();
  let stubGetSiret: StubGetSiret;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    featureFlags = FeatureFlagsBuilder.allOff().build();
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    stubGetSiret = new StubGetSiret();
    addImmersionApplication = createAddImmersionApplicationUseCase();
  });

  const createAddImmersionApplicationUseCase = () =>
    new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      stubGetSiret,
      featureFlags,
    );

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
        wasQuarantined: false,
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

  describe("Status validation", () => {
    // This might be nice for "backing up" entered data, but not implemented in front end as of Dec 16, 2021
    it("allows applications submitted as DRAFT", async () => {
      expect(
        await addImmersionApplication.execute(validImmersionApplication),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    // Replace IN_REVIEW with READY_TO_SIGN when enabling ENABLE_ENTERPRISE_SIGNATURE by default.
    it("allows applications submitted as IN_REVIEW", async () => {
      expect(
        await addImmersionApplication.execute({
          ...validImmersionApplication,
          status: "IN_REVIEW",
        }),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    it("rejects applications if the status is not DRAFT or IN_REVIEW", async () => {
      for (const status of validApplicationStatus) {
        // With ENABLE_ENTERPRISE_SIGNATURE flag, replace IN_REVIEW with READY_TO_SIGN
        if (status === "DRAFT" || status === "IN_REVIEW") {
          continue;
        }
        await expectPromiseToFailWithError(
          addImmersionApplication.execute({
            ...validImmersionApplication,
            status,
          }),
          new ForbiddenError(),
        );
      }
    });
  });

  describe("SIRET validation", () => {
    describe("if feature flag to skip siret validation is ON", () => {
      it("accepts applications with SIRETs that don't correspond to active businesses", async () => {
        featureFlags.enableByPassInseeApi = true;
        stubGetSiret.setNextResponse({
          siret: validImmersionApplication.siret,
          businessName: "INACTIVE BUSINESS",
          businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
          naf: { code: "78.3Z", nomenclature: "Ref2" },
          isOpen: false,
        });

        expect(
          await addImmersionApplication.execute(validImmersionApplication),
        ).toEqual({
          id: validImmersionApplication.id,
        });
      });
    });

    it("rejects applications with SIRETs that don't correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: validImmersionApplication.siret,
        businessName: "INACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: false,
      });

      await expectPromiseToFailWithError(
        addImmersionApplication.execute(validImmersionApplication),
        new BadRequestError(
          `Ce SIRET (${validImmersionApplication.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts applications with SIRETs that  correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: validImmersionApplication.siret,
        businessName: "ACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: true,
      });

      expect(
        await addImmersionApplication.execute(validImmersionApplication),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      stubGetSiret.setErrorForNextCall(error);

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
