import { BadRequestError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { TransformFormEstablishmentIntoSearchData } from "../../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";

import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { expectPromiseToFailWithErrorMatching } from "../../../_testBuilders/test.helpers";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { fakeGetPosition } from "../../../_testBuilders/FakeHttpCalls";

describe("Add FormEstablishment", () => {
  let addFormEstablishment: AddFormEstablishment;
  let formEstablishmentRepository: InMemoryFormEstablishmentRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let inMemorySireneRepository: InMemorySireneRepository;
  let inMemoryImmersionOfferRepository: InMemoryImmersionOfferRepository;
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
    inMemorySireneRepository = new InMemorySireneRepository();
    inMemoryImmersionOfferRepository = new InMemoryImmersionOfferRepository();
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

  test("Adds establishment in repository and converts it in search format", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    expect(await addFormEstablishment.execute(formEstablishment)).toEqual(
      formEstablishment.id,
    );

    const siretEntry = {
      siren: formEstablishment.siret,
      nic: "01234",
      siret: formEstablishment.siret,
      uniteLegale: {
        denominationUniteLegale: formEstablishment.businessName,
        activitePrincipaleUniteLegale: "85.59A",
        nomenclatureActivitePrincipaleUniteLegale: "Ref2",
        trancheEffectifsUniteLegale: "01",
      },
      adresseEtablissement: {
        numeroVoieEtablissement: formEstablishment.businessAddress,
        typeVoieEtablissement: formEstablishment.businessAddress,
        libelleVoieEtablissement: formEstablishment.businessAddress,
        codePostalEtablissement: formEstablishment.businessAddress,
        libelleCommuneEtablissement: formEstablishment.businessAddress,
      },
    };

    inMemorySireneRepository.insert(formEstablishment.siret, siretEntry);
    const transformFormEstablishmentIntoSearchData =
      new TransformFormEstablishmentIntoSearchData(
        formEstablishmentRepository,
        inMemoryImmersionOfferRepository,
        fakeGetPosition,
        inMemorySireneRepository,
      );
    await transformFormEstablishmentIntoSearchData.execute(
      formEstablishment.id,
    );
    const position = await fakeGetPosition(formEstablishment.businessAddress);
    if (formEstablishment.professions[0].romeCodeMetier) {
      const immersions = await inMemoryImmersionOfferRepository.getFromSearch({
        rome: formEstablishment.professions[0].romeCodeMetier,
        distance: 30,
        lat: position.lat,
        lon: position.lon,
      });

      //Verify that immersion matches
      expect(immersions[0].getProps().siret).toEqual(formEstablishment.siret);

      //Verify that the company contact is here
      const contact_in_establishment_from_immersion =
        immersions[0].getProps().contact_in_establishment;
      expect(contact_in_establishment_from_immersion).toBeDefined;
      if (contact_in_establishment_from_immersion) {
        expect(formEstablishment.businessContacts[0].email).toEqual(
          contact_in_establishment_from_immersion.email,
        );
      }
    }

    //If second code rome metier we also test it
    if (formEstablishment.professions[1].romeCodeMetier) {
      const immersions = await inMemoryImmersionOfferRepository.getFromSearch({
        rome: formEstablishment.professions[1].romeCodeMetier,
        distance: 30,
        lat: position.lat,
        lon: position.lon,
      });
      //Verify that immersion matches
      expect(immersions[0].getProps().siret).toEqual(formEstablishment.siret);

      //Verify that the company contact is here
      const contact_in_establishment_from_immersion =
        immersions[0].getProps().contact_in_establishment;
      expect(contact_in_establishment_from_immersion).toBeDefined;
      if (contact_in_establishment_from_immersion) {
        expect(formEstablishment.businessContacts[0].email).toEqual(
          contact_in_establishment_from_immersion.email,
        );
      }
    }
  });
});
