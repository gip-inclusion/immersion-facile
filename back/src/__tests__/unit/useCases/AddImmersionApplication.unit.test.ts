import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../../adapters/secondary/makeStubGetFeatureFlags";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { GetFeatureFlags } from "../../../domain/core/ports/GetFeatureFlags";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { AddImmersionApplication } from "../../../domain/immersionApplication/useCases/AddImmersionApplication";
import { validApplicationStatus } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";

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
  let getFeatureFlags: GetFeatureFlags;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    getFeatureFlags = makeStubGetFeatureFlags({
      enableAdminUi: false,
      enableByPassInseeApi: false,
    });
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    stubGetSiret = new StubGetSiret();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      outboxRepo: outboxRepository,
      immersionApplicationRepo: applicationRepository,
      getFeatureFlags,
    });
    addImmersionApplication = new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      stubGetSiret,
    );
  });

  it("saves valid applications in the repository", async () => {
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
    expect(storedInRepo).toHaveLength(1);
    expect(storedInRepo[0].toDto()).toEqual(validImmersionApplication);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt: occurredAt.toISOString(),
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validImmersionApplication,
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("rejects applications where the ID is already in use", async () => {
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

    it("allows applications submitted as READY_TO_SIGN", async () => {
      expect(
        await addImmersionApplication.execute({
          ...validImmersionApplication,
          status: "READY_TO_SIGN",
        }),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of validApplicationStatus) {
        // eslint-disable-next-line jest/no-if
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
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
        const getFeatureFlagsWithInseeByPass = makeStubGetFeatureFlags({
          enableAdminUi: false,
          enableByPassInseeApi: true,
        });
        uowPerformer.setUow({
          getFeatureFlags: getFeatureFlagsWithInseeByPass,
        });
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
