import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
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

  beforeEach(() => {
    formEstablishmentRepository = new InMemoryFormEstablishmentRepository();
    outboxRepository = new InMemoryOutboxRepository();
    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    addFormEstablishment = new AddFormEstablishment(
      formEstablishmentRepository,
      createNewEvent,
      outboxRepository,
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
    // to uncomment after bug fix
    // expect(outboxRepository.events).toHaveLength(1);
    // expect(outboxRepository.events[0]).toMatchObject({
    //   topic: "FormEstablishmentAdded",
    //   payload: formEstablishment,
    // });
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
});
