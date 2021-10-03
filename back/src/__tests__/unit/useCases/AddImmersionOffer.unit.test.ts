import { z } from "zod";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/InMemoryImmersionOfferRepository";
import { AddImmersionOffer } from "../../../domain/immersionOffer/useCases/AddImmersionOffer";
import { ImmersionOfferDtoBuilder } from "../../../_testBuilders/ImmersionOfferDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Add ImmersionOffer", () => {
  let addImmersionOffer: AddImmersionOffer;
  let applicationRepository: InMemoryImmersionOfferRepository;

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionOfferRepository();
    addImmersionOffer = new AddImmersionOffer(applicationRepository);
  });

  test("saves  application offer in the repository", async () => {
    const validImmersionOffer = ImmersionOfferDtoBuilder.valid().build();

    expect(await addImmersionOffer.execute(validImmersionOffer)).toEqual(
      validImmersionOffer.id,
    );

    const storedInRepo = await applicationRepository.getAll();
    expect(storedInRepo.length).toBe(1);

    expect(storedInRepo[0]).toEqual(validImmersionOffer);
  });

  test("reject when tryingsaving Immersion offer in the repository with null values", async () => {
    const emptyImmersionOffer =
      ImmersionOfferDtoBuilder.allEmptyFields().build();

    await expect(
      addImmersionOffer.execute(emptyImmersionOffer),
    ).rejects.toThrow();
  });

  test("reject when tryingsaving Immersion offer in the repository with null ID", async () => {
    const emptyImmersionOffer = ImmersionOfferDtoBuilder.valid()
      .withId("")
      .build();

    await expect(
      addImmersionOffer.execute(emptyImmersionOffer),
    ).rejects.toThrow();

    await addImmersionOffer
      .execute(emptyImmersionOffer)
      .catch((e: z.ZodError) =>
        expect(e.issues[0].message).toBe("Obligatoire"),
      );
  });
});
