import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../../adapters/secondary/makeStubGetFeatureFlags";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { GetFeatureFlags } from "../../../domain/core/ports/GetFeatureFlags";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";

describe("Add FormEstablishment", () => {
  let addFormEstablishment: AddFormEstablishment;
  let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let stubGetSiret: StubGetSiret;
  let uowPerformer: InMemoryUowPerformer;
  let getFeatureFlags: GetFeatureFlags;

  beforeEach(() => {
    stubGetSiret = new StubGetSiret();
    formEstablishmentRepo = new InMemoryFormEstablishmentRepository();
    outboxRepo = new InMemoryOutboxRepository();
    getFeatureFlags = makeStubGetFeatureFlags({
      enableAdminUi: false,
      enableByPassInseeApi: false,
    });

    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      outboxRepo,
      formEstablishmentRepo,
      getFeatureFlags,
    });
    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    addFormEstablishment = new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      stubGetSiret,
    );
  });

  it("saves an establishment in the repository", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    expect(await addFormEstablishment.execute(formEstablishment)).toEqual(
      formEstablishment.siret,
    );

    const storedInRepo = await formEstablishmentRepo.getAll();
    expect(storedInRepo).toHaveLength(1);
    expect(storedInRepo[0]).toEqual(formEstablishment);
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0]).toMatchObject({
      topic: "FormEstablishmentAdded",
      payload: formEstablishment,
    });
  });

  it("reject when trying to save Form Establishment in the repository with null values", async () => {
    const formEstablishment =
      FormEstablishmentDtoBuilder.allEmptyFields().build();

    await expect(
      addFormEstablishment.execute(formEstablishment),
    ).rejects.toThrow();
  });

  it("reject when trying to save Form Establishment in the repository with null siret", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret("")
      .build();

    try {
      await addFormEstablishment.execute(formEstablishment);
      throw new Error("Should not have been reached");
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(BadRequestError);
    }
  });

  describe("SIRET validation", () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    describe("when feature flag to skip siret validation is on", () => {
      it("accepts formEstablishment with SIRETs that don't correspond to active businesses and quarantines events", async () => {
        const getFeatureFlagsWithInseeByPass = makeStubGetFeatureFlags({
          enableAdminUi: false,
          enableByPassInseeApi: true,
        });
        uowPerformer.setUow({
          getFeatureFlags: getFeatureFlagsWithInseeByPass,
        });
        stubGetSiret.setNextResponse({
          siret: formEstablishment.siret,
          businessName: "INACTIVE BUSINESS",
          businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
          naf: { code: "78.3Z", nomenclature: "Ref2" },
          isOpen: false,
        });

        const response = await addFormEstablishment.execute(formEstablishment);

        expect(response).toBe(formEstablishment.siret);
        expect(outboxRepo.events).toHaveLength(1);
        expectObjectsToMatch(outboxRepo.events[0], {
          topic: "FormEstablishmentAdded",
          publications: [],
          wasQuarantined: true,
        });
      });
    });

    it("rejects formEstablishment with SIRETs that don't correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: formEstablishment.siret,
        businessName: "INACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: false,
      });

      await expectPromiseToFailWithError(
        addFormEstablishment.execute(formEstablishment),
        new BadRequestError(
          `Ce SIRET (${formEstablishment.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts formEstablishment with SIRETs that  correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: formEstablishment.siret,
        businessName: "ACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: true,
      });

      expect(await addFormEstablishment.execute(formEstablishment)).toBe(
        formEstablishment.siret,
      );
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      stubGetSiret.setErrorForNextCall(error);

      await expectPromiseToFailWithError(
        addFormEstablishment.execute(formEstablishment),
        error,
      );
    });
  });
});
