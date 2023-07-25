import {
  addressDtoToString,
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  expectPromiseToFailWithError,
  FormEstablishmentDto,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";

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
  const establishmentJwtPayload: EstablishmentJwtPayload = {
    siret,
    exp: 2,
    iat: 1,
    version: 1,
  };

  const backOfficeJwtPayload: BackOfficeJwtPayload = {
    exp: 2,
    iat: 1,
    version: 1,
    role: "backOffice",
    sub: "admin",
  };

  it("throws an error if there is jwt", async () => {
    const { useCase } = prepareUseCase();
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret),
      new ForbiddenError("Accès refusé"),
    );
  });

  it("throws an error if there is no establishment with this siret", async () => {
    const { useCase } = prepareUseCase();
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret, establishmentJwtPayload),
      new BadRequestError("No establishment found with siret 12345678901234."),
    );
  });

  it("throws an error if there is no establishment from form with this siret", async () => {
    // Prepare : there is an establishment with the siret, but from LBB
    const { useCase } = prepareUseCase();
    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret, establishmentJwtPayload),
      new BadRequestError("No establishment found with siret 12345678901234."),
    );
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & establishment jwt payload", async () => {
    const { useCase, establishmentAggregateRepository } = prepareUseCase();
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder().build();
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
    const retrievedForm = await useCase.execute(
      establishmentJwtPayload.siret,
      establishmentJwtPayload,
    );

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
      maxContactsPerWeek: establishment.maxContactsPerWeek,
    };
    expect(retrievedForm).toMatchObject(expectedForm);
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & backoffice jwt payload", async () => {
    const { useCase, establishmentAggregateRepository } = prepareUseCase();
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder().build();
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
    const retrievedForm = await useCase.execute(siret, backOfficeJwtPayload);

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
      maxContactsPerWeek: establishment.maxContactsPerWeek,
    };
    expect(retrievedForm).toMatchObject(expectedForm);
  });
});
