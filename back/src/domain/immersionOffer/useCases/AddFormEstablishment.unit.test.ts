import {
  AppellationDto,
  defaultValidFormEstablishment,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  FormEstablishmentDtoBuilder,
} from "shared";
import { SirenEstablishmentDtoBuilder } from "../../../_testBuilders/SirenEstablishmentDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryRomeRepository } from "../../../adapters/secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  InMemorySirenGateway,
  TEST_ESTABLISHMENT1,
} from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { AddFormEstablishment } from "./AddFormEstablishment";

describe("Add FormEstablishment", () => {
  let addFormEstablishment: AddFormEstablishment;
  let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let romeRepository: InMemoryRomeRepository;
  let sirenGateway: InMemorySirenGateway;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    sirenGateway = new InMemorySirenGateway();
    const uow = createInMemoryUow();
    formEstablishmentRepo = uow.formEstablishmentRepository;
    outboxRepo = uow.outboxRepository;
    romeRepository = uow.romeRepository;
    sirenGateway.setSirenEstablishment({
      ...TEST_ESTABLISHMENT1,
      siret: defaultValidFormEstablishment.siret,
    });
    romeRepository.appellations = defaultValidFormEstablishment.appellations;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableInseeApi: true,
    });

    uowPerformer = new InMemoryUowPerformer(uow);

    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });

    addFormEstablishment = new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      sirenGateway,
    );
  });

  it("saves an establishment in the repository", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withFitForDisabledWorkers(true)
      .withMaxContactsPerWeek(9)
      .build();

    await addFormEstablishment.execute(formEstablishment);

    const storedInRepo = await formEstablishmentRepo.getAll();
    expect(storedInRepo).toHaveLength(1);
    expect(storedInRepo[0]).toEqual(formEstablishment);
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0]).toMatchObject({
      topic: "FormEstablishmentAdded",
      payload: formEstablishment,
    });
  });

  it("considers appellation_code as a reference, and ignores the labels, and rome (it fetches the one matching the appellation code anyways)", async () => {
    const weirdAppellationDto: AppellationDto = {
      appellationCode: "12694", // le bon code
      appellationLabel:
        "une boulette, ca devrait être 'Coiffeur / Coiffeuse mixte'",
      romeCode: "A0000", // devrait être D1202
      romeLabel: "une autre boulette, ca devrait être 'Coiffure'",
    };

    const formEstablishmentBuilder =
      FormEstablishmentDtoBuilder.valid().withAppellations([
        weirdAppellationDto,
      ]);

    const formEstablishmentWithWeirdAppellationDto =
      formEstablishmentBuilder.build();

    const correctAppellationDto: AppellationDto = {
      appellationCode: "12694",
      appellationLabel: "Coiffeur / Coiffeuse mixte",
      romeCode: "D1202",
      romeLabel: "Coiffure",
    };
    romeRepository.appellations = [correctAppellationDto];

    const formEstablishmentWithCorrectAppellationDto = formEstablishmentBuilder
      .withAppellations([correctAppellationDto])
      .build();

    await addFormEstablishment.execute(
      formEstablishmentWithWeirdAppellationDto,
    );

    const storedInRepo = await formEstablishmentRepo.getAll();
    expect(storedInRepo).toHaveLength(1);
    expect(storedInRepo[0]).toEqual(formEstablishmentWithCorrectAppellationDto);
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0]).toMatchObject({
      topic: "FormEstablishmentAdded",
      payload: formEstablishmentWithCorrectAppellationDto,
    });
  });

  it("cannot save an establishment with same siret", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    formEstablishmentRepo.setFormEstablishments([formEstablishment]);

    await expectPromiseToFailWithError(
      addFormEstablishment.execute(formEstablishment),
      new ConflictError(
        "Establishment with siret 01234567890123 already exists",
      ),
    );
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
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1.siret)
      .build();

    const sirenRawInactiveEstablishment = new SirenEstablishmentDtoBuilder()
      .withSiret(formEstablishment.siret)
      .withIsActive(false)
      .withBusinessName("INACTIVE BUSINESS")
      .withBusinessAddress("20 AVENUE DE SEGUR 75007 PARIS 7")
      .withNafDto({ code: "78.3Z", nomenclature: "Ref2" })
      .build();

    describe("when feature flag to do siret validation is OFF", () => {
      it("accepts formEstablishment with SIRETs that don't correspond to active businesses and quarantines events", async () => {
        const featureFlagRepository = new InMemoryFeatureFlagRepository({
          enableInseeApi: false,
        });
        uowPerformer.setUow({
          featureFlagRepository,
        });
        sirenGateway.setSirenEstablishment({
          ...TEST_ESTABLISHMENT1,
          nafDto: { code: "78.3Z", nomenclature: "Ref2" },
          businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
          isOpen: true,
        });

        await addFormEstablishment.execute(formEstablishment);

        expect(outboxRepo.events).toHaveLength(1);
        expectObjectsToMatch(outboxRepo.events[0], {
          topic: "FormEstablishmentAdded",
          publications: [],
          wasQuarantined: true,
        });
      });
    });

    it("rejects formEstablishment with SIRETs that don't correspond to active businesses", async () => {
      sirenGateway.setSirenEstablishment(sirenRawInactiveEstablishment);

      await expectPromiseToFailWithError(
        addFormEstablishment.execute(formEstablishment),
        new BadRequestError(
          `Ce SIRET (${formEstablishment.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts formEstablishment with SIRETs that  correspond to active businesses", async () => {
      const sirenRawEstablishment = new SirenEstablishmentDtoBuilder().build();
      sirenGateway.setSirenEstablishment(sirenRawEstablishment);
      await addFormEstablishment.execute(formEstablishment);
      expect(outboxRepo.events).toHaveLength(1);
      expect(await formEstablishmentRepo.getAll()).toHaveLength(1);
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      sirenGateway.setError(error);

      await expectPromiseToFailWithError(
        addFormEstablishment.execute(formEstablishment),
        new Error("Le service Sirene API n'est pas disponible"),
      );
    });
  });
});
