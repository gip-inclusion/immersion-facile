import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { BadRequestError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";

describe("Add FormEstablishment", () => {
  let addFormEstablishment: AddFormEstablishment;
  let formEstablishmentRepository: InMemoryFormEstablishmentRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let stubGetSiret: StubGetSiret;

  beforeEach(() => {
    formEstablishmentRepository = new InMemoryFormEstablishmentRepository();
    outboxRepository = new InMemoryOutboxRepository();
    stubGetSiret = new StubGetSiret();
    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    addFormEstablishment = new AddFormEstablishment(
      formEstablishmentRepository,
      createNewEvent,
      outboxRepository,
      stubGetSiret,
    );
  });

  test("saves an establishment in the repository", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    expect(await addFormEstablishment.execute(formEstablishment)).toEqual(
      formEstablishment.id,
    );

    const storedInRepo = await formEstablishmentRepository.getAll();
    expect(storedInRepo.length).toBe(1);
    expect(storedInRepo[0]).toEqual(formEstablishment);
    expect(outboxRepository.events).toHaveLength(1);
    expect(outboxRepository.events[0]).toMatchObject({
      topic: "FormEstablishmentAdded",
      payload: formEstablishment,
    });
  });

  test("reject when trying to save Form Establishment in the repository with null values", async () => {
    const formEstablishment =
      FormEstablishmentDtoBuilder.allEmptyFields().build();

    await expect(
      addFormEstablishment.execute(formEstablishment),
    ).rejects.toThrow();
  });

  test("reject when trying to save Form Establishment in the repository with null ID", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withId("")
      .build();

    try {
      await addFormEstablishment.execute(formEstablishment);
      expect("error").toBe("Should not have been reached");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestError);
    }
  });

  describe("SIRET validation", () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

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
          "Siret ne correspond pas à une entreprise active : " +
            formEstablishment.siret,
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
        formEstablishment.id,
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
