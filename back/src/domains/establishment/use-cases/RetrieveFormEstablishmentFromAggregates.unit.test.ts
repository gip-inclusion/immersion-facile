import {
  EstablishmentJwtPayload,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  addressDtoToString,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { RetrieveFormEstablishmentFromAggregates } from "./RetrieveFormEstablishmentFromAggregates";

const adminBuilder = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .withId("backoffice-admin");
const icAdmin = adminBuilder.build();
const adminUser = adminBuilder.buildUser();

const backofficeAdminJwtPayload = {
  userId: icAdmin.id,
} as InclusionConnectJwtPayload;

describe("Retrieve Form Establishment From Aggregate when payload is valid", () => {
  const siret = "12345678901234";
  const establishmentJwtPayload: EstablishmentJwtPayload = {
    siret,
    exp: 2,
    iat: 1,
    version: 1,
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
      errors.user.noJwtProvided(),
    );
  });

  it("throws an error if there is no establishment with this siret", async () => {
    await expectPromiseToFailWithError(
      useCase.execute(establishmentJwtPayload.siret, establishmentJwtPayload),
      errors.establishment.notFound({ siret: establishmentJwtPayload.siret }),
    );
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & establishment jwt payload", async () => {
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .withSearchableBy({
        jobSeekers: true,
        students: false,
      })
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
      maxContactsPerMonth: establishment.maxContactsPerMonth,
      searchableBy: {
        jobSeekers: true,
        students: false,
      },
      fitForDisabledWorkers: false,
    });
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & IC jwt payload with backoffice rights", async () => {
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

    uow.userRepository.users = [adminUser];
    // Act
    const retrievedForm = await useCase.execute(
      siret,
      backofficeAdminJwtPayload,
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
      maxContactsPerMonth: establishment.maxContactsPerMonth,
      searchableBy: {
        jobSeekers: true,
        students: true,
      },
      fitForDisabledWorkers: false,
    });
  });

  it("returns a reconstructed form if establishment with siret exists with dataSource=form & IC jwt payload with user that have same email on establishment contacts", async () => {
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

    const userWithEstablishmentRights: InclusionConnectedUser = {
      ...icAdmin,
      isBackofficeAdmin: false,
      id: "not-backoffice-user-id",
      establishments: [
        {
          siret: establishment.siret,
          businessName: establishment.name,
        },
      ],
    };

    uow.userRepository.users = [
      new InclusionConnectedUserBuilder(
        userWithEstablishmentRights,
      ).buildUser(),
    ];

    // Act
    const retrievedForm = await useCase.execute(siret, {
      userId: userWithEstablishmentRights.id,
    } as InclusionConnectJwtPayload);

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
      maxContactsPerMonth: establishment.maxContactsPerMonth,
      searchableBy: {
        jobSeekers: true,
        students: true,
      },
      fitForDisabledWorkers: false,
    });
  });
});
