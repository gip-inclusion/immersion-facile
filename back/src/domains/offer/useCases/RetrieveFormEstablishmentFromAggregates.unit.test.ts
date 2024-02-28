import {
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  addressDtoToString,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../../../adapters/secondary/offer/EstablishmentBuilders";
import { RetrieveFormEstablishmentFromAggregates } from "./RetrieveFormEstablishmentFromAggregates";

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
  let useCase: RetrieveFormEstablishmentFromAggregates;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new RetrieveFormEstablishmentFromAggregates(
      new InMemoryUowPerformer(uow),
    );
  });

  it("throws an error if there is no jwt", async () => {
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret),
      new ForbiddenError("Accès refusé"),
    );
  });

  it("throws an error if there is no establishment with this siret", async () => {
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret, establishmentJwtPayload),
      new BadRequestError("No establishment found with siret 12345678901234."),
    );
  });

  it("throws an error if there is no establishment from form with this siret", async () => {
    // Prepare : there is an establishment with the siret, but from LBB
    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret, establishmentJwtPayload),
      new BadRequestError("No establishment found with siret 12345678901234."),
    );
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & establishment jwt payload", async () => {
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder().build();
    const offer = new OfferEntityBuilder()
      .withRomeCode("A1101")
      .withAppellationCode("11987")
      .build();

    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withOffers([offer])
        .build(),
    );
    // Act
    const retrievedForm = await useCase.execute(
      establishmentJwtPayload.siret,
      establishmentJwtPayload,
    );

    // Assert
    expectToEqual(retrievedForm, {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddresses: establishment.locations.map((location) => ({
        rawAddress: addressDtoToString(location.address),
        id: location.id,
      })),
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment.nafDto,
      appellations: [
        {
          romeCode: offer.romeCode,
          romeLabel: offer.romeLabel,
          appellationCode: offer.appellationCode,
          appellationLabel: offer.appellationLabel,
        },
      ],
      businessContact: contact,
      website: establishment.website,
      additionalInformation: establishment.additionalInformation,
      maxContactsPerWeek: establishment.maxContactsPerWeek,
      searchableBy: {
        jobSeekers: true,
        students: true,
      },
      fitForDisabledWorkers: false,
    });
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & backoffice jwt payload", async () => {
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder().build();
    const offer = new OfferEntityBuilder()
      .withRomeCode("A1101")
      .withAppellationCode("11987")
      .build();

    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withOffers([offer])
        .build(),
    );
    // Act
    const retrievedForm = await useCase.execute(siret, backOfficeJwtPayload);

    // Assert
    expectToEqual(retrievedForm, {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddresses: establishment.locations.map((location) => ({
        rawAddress: addressDtoToString(location.address),
        id: location.id,
      })),
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment.nafDto,
      appellations: [
        {
          romeCode: offer.romeCode,
          romeLabel: offer.romeLabel,
          appellationCode: offer.appellationCode,
          appellationLabel: offer.appellationLabel,
        },
      ],
      businessContact: contact,
      website: establishment.website,
      additionalInformation: establishment.additionalInformation,
      maxContactsPerWeek: establishment.maxContactsPerWeek,
      searchableBy: {
        jobSeekers: true,
        students: true,
      },
      fitForDisabledWorkers: false,
    });
  });
});
