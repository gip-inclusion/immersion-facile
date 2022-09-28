import { FormEstablishmentDto } from "shared";
import { EstablishmentJwtPayload } from "shared";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { addressDtoToString } from "shared";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const useCase = new RetrieveFormEstablishmentFromAggregates(
    new InMemoryUowPerformer(uow),
  );

  return {
    useCase,
    establishmentAggregateRepository,
  };
};

describe("Retrieve Form Establishment From Aggregate when payload is valid", () => {
  const siret = "12345678901234";
  const jwtPayload: EstablishmentJwtPayload = {
    siret,
    exp: 2,
    iat: 1,
    version: 1,
  };
  it("throws an error if there is no establishment with this siret", async () => {
    const { useCase } = prepareUseCase();
    await expectPromiseToFailWithError(
      useCase.execute(jwtPayload.siret, jwtPayload),
      new BadRequestError(
        "No establishment found with siret 12345678901234 and form data source. ",
      ),
    );
  });
  it("throws an error if there is no establishment from form with this siret", async () => {
    // Prepare : there is an establishment with the siret, but from LBB
    const { useCase, establishmentAggregateRepository } = prepareUseCase();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withSiret(siret)
            .withDataSource("api_labonneboite")
            .build(),
        )
        .build(),
    ]);
    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(jwtPayload.siret, jwtPayload),
      new BadRequestError(
        "No establishment found with siret 12345678901234 and form data source. ",
      ),
    );
  });
  it("returns a reconstructed form if establishment with siret exists with dataSource=form", async () => {
    const { useCase, establishmentAggregateRepository } = prepareUseCase();
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withDataSource("form")
      .build();
    const contact = new ContactEntityV2Builder().build();
    const offer = new ImmersionOfferEntityV2Builder()
      .withRomeCode("A1101")
      .withAppellationCode("11987")
      .build();

    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([offer])
        .build(),
    ]);
    // Act
    const retrievedForm = await useCase.execute(jwtPayload.siret, jwtPayload);

    // Assert
    expect(retrievedForm).toBeDefined();
    const expectedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddress: addressDtoToString(establishment.address),
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment.nafDto,
      isSearchable: establishment.isSearchable,
      appellations: [
        {
          appellationLabel: "test_appellation_label",
          romeLabel: "test_rome_label",
          romeCode: "A1101",
          appellationCode: "11987",
        },
      ],
      businessContact: contact,
      website: establishment.website,
      additionalInformation: establishment.additionalInformation,
    };
    expect(retrievedForm).toMatchObject(expectedForm);
  });
});
