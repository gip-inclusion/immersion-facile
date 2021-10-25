import { BadRequestError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { expectPromiseToFailWithErrorMatching } from "../../../_testBuilders/test.helpers";

describe("Add FormEstablishment", () => {
  let addFormEstablishment: AddFormEstablishment;
  let formEstablishmentRepository: InMemoryFormEstablishmentRepository;

  beforeEach(() => {
    formEstablishmentRepository = new InMemoryFormEstablishmentRepository();
    addFormEstablishment = new AddFormEstablishment(
      formEstablishmentRepository,
    );
  });

  test("saves an establishment in the repository", async () => {
    const validImmersionOffer = FormEstablishmentDtoBuilder.valid().build();

    expect(await addFormEstablishment.execute(validImmersionOffer)).toEqual(
      validImmersionOffer.id,
    );

    const storedInRepo = await formEstablishmentRepository.getAll();
    expect(storedInRepo.length).toBe(1);

    expect(storedInRepo[0]).toEqual(validImmersionOffer);
  });

  test("reject when tryingsaving Immersion offer in the repository with null values", async () => {
    const emptyImmersionOffer =
      FormEstablishmentDtoBuilder.allEmptyFields().build();

    await expect(
      addFormEstablishment.execute(emptyImmersionOffer),
    ).rejects.toThrow();
  });

  test("reject when tryingsaving Immersion offer in the repository with null ID", async () => {
    const emptyImmersionOffer = FormEstablishmentDtoBuilder.valid()
      .withId("")
      .build();

    try {
      await addFormEstablishment.execute(emptyImmersionOffer);
      expect("error").toBe("Should not have been reached");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestError);
    }
  });
});
