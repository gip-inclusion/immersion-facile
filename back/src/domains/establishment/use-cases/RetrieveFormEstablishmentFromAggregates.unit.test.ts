import {
  addressDtoToString,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  type FormEstablishmentDto,
  formEstablishmentSchema,
  type SiretDto,
  type User,
  UserBuilder,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { RetrieveFormEstablishmentFromAggregates } from "./RetrieveFormEstablishmentFromAggregates";

describe("Retrieve Form Establishment From Aggregate when payload is valid", () => {
  const adminBuilder = new ConnectedUserBuilder()
    .withIsAdmin(true)
    .withId("backoffice-admin");
  const connectedAdmin = adminBuilder.build();
  const adminUser = adminBuilder.buildUser();

  const establishmentAdmin = new UserBuilder()
    .withId("admin-id")
    .withEmail("admin@mail.com")
    .build();
  const establishmentContact = new UserBuilder()
    .withId("contact-id")
    .withEmail("contact@email.com")
    .build();

  const job = "Chef";
  const phone = "+33600000000";
  const siret: SiretDto = "12345678901234";

  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withSearchableBy({
          jobSeekers: true,
          students: false,
        })
        .build(),
    )
    .withOffers([
      new OfferEntityBuilder()
        .withRomeCode("A1101")
        .withAppellationCode("11987")
        .build(),
    ])
    .withUserRights([
      {
        userId: establishmentAdmin.id,
        role: "establishment-admin",
        job,
        phone,
        shouldReceiveDiscussionNotifications: true,
      },
      {
        userId: establishmentContact.id,
        role: "establishment-contact",
        shouldReceiveDiscussionNotifications: true,
      },
    ])
    .build();

  let useCase: RetrieveFormEstablishmentFromAggregates;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new RetrieveFormEstablishmentFromAggregates(
      new InMemoryUowPerformer(uow),
    );

    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    uow.userRepository.users = [
      establishmentAdmin,
      establishmentContact,
      adminUser,
    ];
  });

  describe("Wrong paths", () => {
    it("throws an error if there is no jwt", async () => {
      await expectPromiseToFailWithError(
        useCase.execute(siret),
        errors.user.noJwtProvided(),
      );
    });

    it("throws an error if there is no establishment with this siret", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      await expectPromiseToFailWithError(
        useCase.execute(siret, {
          userId: connectedAdmin.id,
        }),
        errors.establishment.notFound({ siret }),
      );
    });
  });

  describe("Right paths", () => {
    it("returns a reconstructed schema validated form if establishment with siret exists & IC jwt payload with backoffice rights even if admin don't have firstname or lastname", async () => {
      const adminWithoutFirstNameAndLastName = new ConnectedUserBuilder()
        .withId("admin-no-name-id")
        .withEmail("admin@mail.com")
        .withLastName("")
        .withFirstName("")
        .buildUser();

      const establishmentAggregateWithAdminUserWithoutNames =
        new EstablishmentAggregateBuilder(establishmentAggregate)
          .withUserRights([
            {
              role: "establishment-admin",
              userId: adminWithoutFirstNameAndLastName.id,
              job,
              phone,
              shouldReceiveDiscussionNotifications: true,
            },
            {
              userId: establishmentContact.id,
              role: "establishment-contact",
              shouldReceiveDiscussionNotifications: true,
            },
          ])
          .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregateWithAdminUserWithoutNames,
      ];

      uow.userRepository.users = [
        connectedAdmin,
        adminWithoutFirstNameAndLastName,
        establishmentContact,
      ];

      const establishmentForm = await useCase.execute(siret, {
        userId: adminWithoutFirstNameAndLastName.id,
      });

      expectToEqual(
        formEstablishmentSchema.parse(establishmentForm),
        makeExpectedFormEstablishment({
          establishmentAggregate:
            establishmentAggregateWithAdminUserWithoutNames,
          establishmentContact,
          establishmentAdmin: adminWithoutFirstNameAndLastName,
          job,
          phone,
        }),
      );
    });

    it("returns a reconstructed form if establishment with siret exists & IC jwt payload with backoffice rights", async () => {
      const establishmentForm = await useCase.execute(siret, {
        userId: connectedAdmin.id,
      });

      expectToEqual(
        establishmentForm,
        makeExpectedFormEstablishment({
          establishmentAdmin,
          establishmentAggregate,
          establishmentContact,
          job,
          phone,
        }),
      );
    });

    it("returns a reconstructed form if establishment with siret exists & IC jwt payload with user that have same email on establishment contacts", async () => {
      const establishmentForm = await useCase.execute(siret, {
        userId: establishmentContact.id,
      });

      expectToEqual(
        establishmentForm,
        makeExpectedFormEstablishment({
          establishmentAdmin,
          establishmentAggregate,
          establishmentContact,
          job,
          phone,
        }),
      );
    });
  });
});

const makeExpectedFormEstablishment = ({
  establishmentAggregate,
  establishmentContact,
  establishmentAdmin,
  job,
  phone,
}: {
  establishmentAggregate: EstablishmentAggregate;
  establishmentContact: User;
  establishmentAdmin: User;
  job: string;
  phone: string;
}): FormEstablishmentDto => ({
  siret: establishmentAggregate.establishment.siret,
  source: "immersion-facile",
  businessName: establishmentAggregate.establishment.name,
  businessNameCustomized: establishmentAggregate.establishment.customizedName,
  businessAddresses: establishmentAggregate.establishment.locations.map(
    (location) => ({
      rawAddress: addressDtoToString(location.address),
      id: location.id,
    }),
  ),
  isEngagedEnterprise: establishmentAggregate.establishment.isCommited,
  naf: establishmentAggregate.establishment.nafDto,
  appellations: establishmentAggregate.offers.map((offer) => ({
    appellationCode: offer.appellationCode,
    appellationLabel: offer.appellationLabel,
    romeCode: offer.romeCode,
    romeLabel: offer.romeLabel,
  })),
  userRights: [
    {
      role: "establishment-admin",
      email: establishmentAdmin.email,
      job,
      phone,
      shouldReceiveDiscussionNotifications: true,
    },
    {
      role: "establishment-contact",
      email: establishmentContact.email,
      shouldReceiveDiscussionNotifications: true,
    },
  ],
  contactMode: establishmentAggregate.establishment.contactMode,
  website: establishmentAggregate.establishment.website,
  additionalInformation:
    establishmentAggregate.establishment.additionalInformation,
  maxContactsPerMonth: establishmentAggregate.establishment.maxContactsPerMonth,
  fitForDisabledWorkers: false,
  searchableBy: {
    jobSeekers: true,
    students: false,
  },
});
