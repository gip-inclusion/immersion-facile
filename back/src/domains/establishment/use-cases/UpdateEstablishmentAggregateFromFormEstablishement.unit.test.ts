import {
  type AdminFormEstablishmentUserRight,
  type AppellationAndRomeDto,
  type ContactFormEstablishmentUserRight,
  type FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  type SiretDto,
  UserBuilder,
  addressDtoToString,
  defaultAddress,
  errors,
  expectObjectInArrayToMatch,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  updatedAddress1,
  updatedAddress2,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  InMemoryAddressGateway,
  rueGuillaumeTellDto,
} from "../../core/address/adapters/InMemoryAddressGateway";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { InMemorySiretGateway } from "../../core/sirene/adapters/InMemorySiretGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type {
  EstablishmentAdminRight,
  EstablishmentContactRight,
} from "../entities/EstablishmentAggregate";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { UpdateEstablishmentAggregateFromForm } from "./UpdateEstablishmentAggregateFromFormEstablishement";

describe("Update Establishment aggregate from form data", () => {
  let siretGateway: InMemorySiretGateway;
  let addressGateway: InMemoryAddressGateway;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let updateEstablishmentAggregateFromFormUseCase: UpdateEstablishmentAggregateFromForm;

  const creationDate = new Date("2022-01-01");
  const now = new Date();

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    addressGateway = new InMemoryAddressGateway();
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway(now);
    updateEstablishmentAggregateFromFormUseCase =
      new UpdateEstablishmentAggregateFromForm(
        new InMemoryUowPerformer(uow),
        addressGateway,
        uuidGenerator,
        timeGateway,
        makeCreateNewEvent({ timeGateway, uuidGenerator }),
        makeSaveNotificationAndRelatedEvent(uuidGenerator, timeGateway),
      );
  });

  it("Fails if establishment does not exists amongst aggregates", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [];
    const user = new InclusionConnectedUserBuilder().buildUser();
    uow.userRepository.users = [user];

    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();
    await expectPromiseToFailWithError(
      updateEstablishmentAggregateFromFormUseCase.execute(
        {
          formEstablishment,
        },
        {
          userId: user.id,
        },
      ),
      errors.establishment.notFound({
        siret: formEstablishment.siret,
      }),
    );
  });

  describe("Replaces establishment and offers with same siret, and apply users rights", () => {
    const siret: SiretDto = "12345678911234";

    const previousEstablishmentAdmin = new UserBuilder()
      .withEmail("previous.admin@mail.com")
      .build();
    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(siret)
          .withMaxContactsPerMonth(6)
          .withScore(25)
          .withCreatedAt(creationDate)
          .build(),
      )
      .withOffers([
        new OfferEntityBuilder().build(),
        new OfferEntityBuilder().build(),
      ])
      .withSearchableBy({
        jobSeekers: false,
        students: true,
      })
      .withUserRights([
        {
          userId: previousEstablishmentAdmin.id,
          role: "establishment-admin",
          job: "job",
          phone: "+336558464365",
        },
      ])
      .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        previousAggregate,
      ];

      siretGateway.setSirenEstablishment({
        siret,
        businessAddress: "1 rue Guillaume Tell, 75017 Paris",
        businessName: "My establishment",
        nafDto: { code: "1234Z", nomenclature: "Ref2" },
        isOpen: true,
        numberEmployeesRange: "10-19",
      });

      addressGateway.setNextLookupStreetAndAddresses([
        [
          {
            address: rueGuillaumeTellDto,
            position: { lon: 1, lat: 2 },
          },
        ],
      ]);
    });

    const newEstablishmentAdmin = new UserBuilder()
      .withId("establishmentAdmin")
      .withEmail("new.admin@gmail.com")
      .withCreatedAt(now)
      .build();
    const newEstablishmentContact = new UserBuilder()
      .withId("updatedContact")
      .withEmail("new.contact@gmail.com")
      .withCreatedAt(now)
      .build();

    const updatedAppellation: AppellationAndRomeDto = {
      romeLabel: "Boulangerie",
      appellationLabel: "Boulanger",
      romeCode: "A1101",
      appellationCode: "22222",
    };
    const nextAvailabilityDate = new Date();
    const updatedFormAdmin: AdminFormEstablishmentUserRight = {
      role: "establishment-admin",
      email: newEstablishmentAdmin.email,
      job: "new job",
      phone: "+33677445511",
    };
    const updatedFormContact: ContactFormEstablishmentUserRight = {
      role: "establishment-contact",
      email: newEstablishmentContact.email,
    };
    const updatedFormEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withAppellations([updatedAppellation])
      .withBusinessAddresses([
        {
          id: defaultAddress.formAddress.id,
          rawAddress: addressDtoToString(rueGuillaumeTellDto),
        },
      ])
      .withUserRights([updatedFormAdmin, updatedFormContact])
      .withNextAvailabilityDate(nextAvailabilityDate)
      .withMaxContactsPerMonth(10)
      .withSearchableBy({
        jobSeekers: true,
        students: false,
      })
      .build();

    it("When users already existed", async () => {
      uow.userRepository.users = [
        previousEstablishmentAdmin,
        newEstablishmentAdmin,
        newEstablishmentContact,
      ];

      await updateEstablishmentAggregateFromFormUseCase.execute(
        {
          formEstablishment: updatedFormEstablishment,
        },
        {
          userId: previousEstablishmentAdmin.id,
        },
      );

      expectToEqual(uow.userRepository.users, [
        previousEstablishmentAdmin,
        newEstablishmentAdmin,
        newEstablishmentContact,
      ]);

      expectToEqual(
        uow.establishmentAggregateRepository.establishmentAggregates,
        [
          new EstablishmentAggregateBuilder(previousAggregate)
            .withEstablishment(
              new EstablishmentEntityBuilder(previousAggregate.establishment)
                .withCreatedAt(creationDate)
                .withCustomizedName(
                  updatedFormEstablishment.businessNameCustomized,
                )
                .withFitForDisabledWorkers(
                  updatedFormEstablishment.fitForDisabledWorkers,
                )
                .withIsCommited(updatedFormEstablishment.isEngagedEnterprise)
                .withIsOpen(true)
                .withName(updatedFormEstablishment.businessName)
                .withMaxContactsPerMonth(
                  updatedFormEstablishment.maxContactsPerMonth,
                )
                .withLocations([
                  {
                    address: rueGuillaumeTellDto,
                    position: { lon: 1, lat: 2 },
                    id: defaultAddress.formAddress.id,
                  },
                ])
                .withUpdatedAt(timeGateway.now())
                .withWebsite(updatedFormEstablishment.website)
                .withNextAvailabilityDate(nextAvailabilityDate)
                .withSearchableBy(updatedFormEstablishment.searchableBy)
                .build(),
            )
            .withOffers([
              new OfferEntityBuilder()
                .withRomeLabel(updatedAppellation.romeLabel)
                .withRomeCode(updatedAppellation.romeCode)
                .withAppellationCode(updatedAppellation.appellationCode)
                .withAppellationLabel(updatedAppellation.appellationLabel)
                .withCreatedAt(timeGateway.now())
                .build(),
            ])
            .withUserRights([
              {
                role: "establishment-admin",
                userId: newEstablishmentAdmin.id,
                job: updatedFormAdmin.job,
                phone: updatedFormAdmin.phone,
              },
              {
                role: "establishment-contact",
                userId: newEstablishmentContact.id,
              },
            ])
            .build(),
        ],
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "UpdatedEstablishmentAggregateInsertedFromForm",
          payload: {
            siret,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: previousEstablishmentAdmin.id,
            },
          },
        },
      ]);
    });

    it("When users not exist, create user additionnaly", async () => {
      uuidGenerator.setNextUuids([
        newEstablishmentAdmin.id,
        newEstablishmentContact.id,
      ]);

      uow.userRepository.users = [previousEstablishmentAdmin];

      await updateEstablishmentAggregateFromFormUseCase.execute(
        {
          formEstablishment: updatedFormEstablishment,
        },
        {
          userId: previousEstablishmentAdmin.id,
        },
      );

      expectToEqual(uow.userRepository.users, [
        previousEstablishmentAdmin,
        new UserBuilder(newEstablishmentAdmin)
          .withFirstName("")
          .withLastName("")
          .build(),
        new UserBuilder(newEstablishmentContact)
          .withFirstName("")
          .withLastName("")
          .build(),
      ]);

      expectToEqual(
        uow.establishmentAggregateRepository.establishmentAggregates,
        [
          new EstablishmentAggregateBuilder(previousAggregate)
            .withEstablishment(
              new EstablishmentEntityBuilder(previousAggregate.establishment)
                .withCreatedAt(creationDate)
                .withCustomizedName(
                  updatedFormEstablishment.businessNameCustomized,
                )
                .withFitForDisabledWorkers(
                  updatedFormEstablishment.fitForDisabledWorkers,
                )
                .withIsCommited(updatedFormEstablishment.isEngagedEnterprise)
                .withIsOpen(true)
                .withName(updatedFormEstablishment.businessName)
                .withMaxContactsPerMonth(
                  updatedFormEstablishment.maxContactsPerMonth,
                )
                .withLocations([
                  {
                    address: rueGuillaumeTellDto,
                    position: { lon: 1, lat: 2 },
                    id: defaultAddress.formAddress.id,
                  },
                ])
                .withUpdatedAt(timeGateway.now())
                .withWebsite(updatedFormEstablishment.website)
                .withNextAvailabilityDate(nextAvailabilityDate)
                .withSearchableBy(updatedFormEstablishment.searchableBy)
                .build(),
            )
            .withOffers([
              new OfferEntityBuilder()
                .withRomeLabel(updatedAppellation.romeLabel)
                .withRomeCode(updatedAppellation.romeCode)
                .withAppellationCode(updatedAppellation.appellationCode)
                .withAppellationLabel(updatedAppellation.appellationLabel)
                .withCreatedAt(timeGateway.now())
                .build(),
            ])
            .withUserRights([
              {
                role: "establishment-admin",
                userId: newEstablishmentAdmin.id,
                job: updatedFormAdmin.job,
                phone: updatedFormAdmin.phone,
              },
              {
                role: "establishment-contact",
                userId: newEstablishmentContact.id,
              },
            ])
            .build(),
        ],
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "UpdatedEstablishmentAggregateInsertedFromForm",
          payload: {
            siret,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: previousEstablishmentAdmin.id,
            },
          },
        },
      ]);
    });
  });

  describe("Behavior of EditFormEstablishment", () => {
    let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
    const existingFormEstablishment =
      FormEstablishmentDtoBuilder.valid().build();
    const updatedFormEstablishment = FormEstablishmentDtoBuilder.fullyUpdated()
      .withSiret(existingFormEstablishment.siret)
      .build();

    const backofficeAdminUserBuilder =
      new InclusionConnectedUserBuilder().withIsAdmin(true);
    const icBackofficeAdminUser = backofficeAdminUserBuilder.build();
    const backofficeAdminUser = backofficeAdminUserBuilder.buildUser();

    const inclusionConnectedUserBuilder = new InclusionConnectedUserBuilder()
      .withId("inclusion-connected-user")
      .withIsAdmin(false);
    const icInclusionConnectedUser = inclusionConnectedUserBuilder.build();
    const inclusionConnectedUser = inclusionConnectedUserBuilder.buildUser();

    const inclusionConnectJwtPayload: InclusionConnectDomainJwtPayload = {
      userId: icInclusionConnectedUser.id,
    };

    const existingEstablishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(existingFormEstablishment.siret)
          .withName(existingFormEstablishment.businessName)
          .withSearchableBy(existingFormEstablishment.searchableBy)
          .withContactMethod(existingFormEstablishment.contactMethod)
          .withCustomizedName(existingFormEstablishment.businessNameCustomized)
          .withFitForDisabledWorkers(
            existingFormEstablishment.fitForDisabledWorkers,
          )
          .withMaxContactsPerMonth(
            existingFormEstablishment.maxContactsPerMonth,
          )
          .withNumberOfEmployeeRange("1-2")
          .withSourceProvider(existingFormEstablishment.source)
          .withWebsite(existingFormEstablishment.website)
          .withNafDto({
            code: "F2245",
            nomenclature: "nafRev2",
          })
          .withAcquisition({
            acquisitionCampaign: existingFormEstablishment.acquisitionCampaign,
            acquisitionKeyword: existingFormEstablishment.acquisitionKeyword,
          })
          .withNextAvailabilityDate(
            existingFormEstablishment.nextAvailabilityDate &&
              new Date(existingFormEstablishment.nextAvailabilityDate),
          )
          .withCreatedAt(creationDate)
          .withUpdatedAt(creationDate)
          .withIsCommited(existingFormEstablishment.isEngagedEnterprise)
          .withAdditionalInformation(
            existingFormEstablishment.additionalInformation,
          )
          .withScore(0)
          .build(),
      )
      .withLocations([
        {
          ...defaultAddress.addressAndPosition,
          id: defaultAddress.formAddress.id,
        },
      ])
      .withUserRights([
        {
          role: "establishment-admin",
          job: "",
          phone: "",
          userId: inclusionConnectedUser.id,
        },
      ])
      .build();

    const newAdminRight: EstablishmentAdminRight = {
      role: "establishment-admin",
      job: "new job",
      phone: "+33612345679",
      userId: "nextuser1",
    };
    const newContactRight: EstablishmentContactRight = {
      role: "establishment-contact",
      userId: "nextuser2",
    };
    const updatedEstablishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(updatedFormEstablishment.siret)
          .withName(updatedFormEstablishment.businessName)
          .withSearchableBy(updatedFormEstablishment.searchableBy)
          .withContactMethod(updatedFormEstablishment.contactMethod)
          .withCustomizedName(updatedFormEstablishment.businessNameCustomized)
          .withFitForDisabledWorkers(
            updatedFormEstablishment.fitForDisabledWorkers,
          )
          .withMaxContactsPerMonth(updatedFormEstablishment.maxContactsPerMonth)
          .withNumberOfEmployeeRange("1-2")
          .withSourceProvider(updatedFormEstablishment.source)
          .withWebsite(updatedFormEstablishment.website)
          .withNafDto({
            code: "F2245",
            nomenclature: "nafRev2",
          })
          .withAcquisition({
            acquisitionCampaign: updatedFormEstablishment.acquisitionCampaign,
            acquisitionKeyword: updatedFormEstablishment.acquisitionKeyword,
          })
          .withNextAvailabilityDate(
            updatedFormEstablishment.nextAvailabilityDate &&
              new Date(updatedFormEstablishment.nextAvailabilityDate),
          )
          .withCreatedAt(creationDate)
          .withUpdatedAt(now)
          .withIsCommited(updatedFormEstablishment.isEngagedEnterprise)
          .withAdditionalInformation(
            updatedFormEstablishment.additionalInformation,
          )
          .withScore(0)
          .build(),
      )
      .withOffers(
        updatedFormEstablishment.appellations.map((appellation) => ({
          ...appellation,
          createdAt: now,
        })),
      )
      .withLocations([
        {
          ...updatedAddress1.addressAndPosition,
          id: updatedAddress1.formAddress.id,
        },
        {
          ...updatedAddress2.addressAndPosition,
          id: updatedAddress2.formAddress.id,
        },
      ])
      .withUserRights([newAdminRight, newContactRight])
      .build();

    beforeEach(() => {
      addressGateway.setNextLookupStreetAndAddresses([
        [updatedAddress1.addressAndPosition],
        [updatedAddress2.addressAndPosition],
      ]);

      uow.establishmentAggregateRepository.establishmentAggregates = [
        existingEstablishmentAggregate,
      ];

      uuidGenerator.setNextUuids([
        newAdminRight.userId,
        newContactRight.userId,
      ]);

      expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
        uow.notificationRepository,
        uow.outboxRepository,
      );
    });

    describe("Wrong paths", () => {
      it("Not found error if user is not found", async () => {
        await expectPromiseToFailWithError(
          updateEstablishmentAggregateFromFormUseCase.execute(
            { formEstablishment: updatedFormEstablishment },
            inclusionConnectJwtPayload,
          ),
          errors.user.notFound({ userId: inclusionConnectJwtPayload.userId }),
        );
      });

      it("Forbidden error on InclusionConnectJwtPayload with ic user that doesn't have rights on establishment", async () => {
        uow.userRepository.users = [inclusionConnectedUser];
        uow.establishmentAggregateRepository.establishmentAggregates = [
          { ...existingEstablishmentAggregate, userRights: [] },
        ];

        await expectPromiseToFailWithError(
          updateEstablishmentAggregateFromFormUseCase.execute(
            { formEstablishment: updatedFormEstablishment },
            inclusionConnectJwtPayload,
          ),
          errors.user.forbidden({ userId: icInclusionConnectedUser.id }),
        );
      });

      it("Forbidden error without jwt payload", async () => {
        await expectPromiseToFailWithError(
          updateEstablishmentAggregateFromFormUseCase.execute({
            formEstablishment: updatedFormEstablishment,
          }),
          errors.user.noJwtProvided(),
        );
      });

      it("conflict error when form does not exist", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [];

        await expectPromiseToFailWithError(
          updateEstablishmentAggregateFromFormUseCase.execute(
            { formEstablishment: updatedFormEstablishment },
            inclusionConnectJwtPayload,
          ),
          errors.establishment.notFound({
            siret: updatedFormEstablishment.siret,
          }),
        );
      });
    });

    describe("Right paths", () => {
      it("publish a FormEstablishmentEdited event & update formEstablishment on repository with an inclusion connected payload", async () => {
        uow.userRepository.users = [inclusionConnectedUser];

        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishment },
          inclusionConnectJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UpdatedEstablishmentAggregateInsertedFromForm",
            payload: {
              siret: updatedFormEstablishment.siret,
              triggeredBy: {
                kind: "inclusion-connected",
                userId: inclusionConnectJwtPayload.userId,
              },
            },
          },
        ]);

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [updatedEstablishmentAggregate],
        );
      });

      it("publish a FormEstablishmentEdited event & update formEstablishment on repository with a IC payload with user with backoffice rights", async () => {
        uow.userRepository.users = [backofficeAdminUser];

        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishment },
          {
            userId: icBackofficeAdminUser.id,
          },
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UpdatedEstablishmentAggregateInsertedFromForm",
            payload: {
              siret: updatedFormEstablishment.siret,
              triggeredBy: {
                kind: "inclusion-connected",
                userId: icBackofficeAdminUser.id,
              },
            },
          },
        ]);

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [updatedEstablishmentAggregate],
        );
      });
      it("sends a notification to added and updated user & update formEstablishment and userRights on repository with a IC payload with user with establishment-admin rights", async () => {
        uow.userRepository.users = [inclusionConnectedUser];
        uuidGenerator.setNextUuids([
          "next-user-1",
          "notification-id-1",
          "event-id-1",
          "notification-id-2",
          "event-id-2",
        ]);
        const newAdminEmail = "new.admin@gmail.com";
        const newAdminRight: EstablishmentAdminRight = {
          role: "establishment-admin",
          job: "new job",
          phone: "+33612345679",
          userId: "next-user-1",
        };
        const updatedFormEstablishmentWithUserRights: FormEstablishmentDto = {
          ...updatedFormEstablishment,
          userRights: [
            {
              role: "establishment-contact",
              email: inclusionConnectedUser.email,
            },
            {
              role: newAdminRight.role,
              email: newAdminEmail,
              job: newAdminRight.job,
              phone: newAdminRight.phone,
            },
          ],
        };
        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishmentWithUserRights },
          {
            userId: inclusionConnectedUser.id,
          },
        );

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            {
              ...updatedEstablishmentAggregate,
              userRights: [
                {
                  userId: inclusionConnectedUser.id,
                  role: "establishment-contact",
                },
                newAdminRight,
              ],
            },
          ],
        );

        expectObjectsToMatch(uow.userRepository.users, [
          inclusionConnectedUser,
          {
            id: newAdminRight.userId,
            email: newAdminEmail,
            firstName: "",
            lastName: "",
            createdAt: now.toISOString(),
            externalId: null,
          },
        ]);

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "ESTABLISHMENT_USER_RIGHTS_ADDED",
              params: {
                businessName:
                  updatedFormEstablishmentWithUserRights.businessNameCustomized ??
                  updatedFormEstablishmentWithUserRights.businessName,
                firstName: "",
                lastName: "", // User is not connected at this moment, can't have firstname / lastname
                triggeredByUserFirstName: icBackofficeAdminUser.firstName,
                triggeredByUserLastName: icBackofficeAdminUser.lastName,
                role: "establishment-admin",
              },
              recipients: [newAdminEmail],
            },
            {
              kind: "ESTABLISHMENT_USER_RIGHTS_UPDATED",
              params: {
                businessName:
                  updatedFormEstablishmentWithUserRights.businessNameCustomized ??
                  updatedFormEstablishmentWithUserRights.businessName,
                firstName: inclusionConnectedUser.firstName,
                lastName: inclusionConnectedUser.lastName,
                triggeredByUserFirstName: icBackofficeAdminUser.firstName,
                triggeredByUserLastName: icBackofficeAdminUser.lastName,
                updatedRole: "establishment-contact",
              },
              recipients: [inclusionConnectedUser.email],
            },
          ],
        });
      });
      it("doesn't send any notification if userRight is not updated or deleted with a IC payload with user with establishment-admin rights", async () => {
        const establishmentContactUser = new UserBuilder()
          .withId("establishment-contact-user")
          .withEmail("establishment-contact@gmail.com")
          .build();
        uow.userRepository.users = [
          inclusionConnectedUser,
          establishmentContactUser,
        ];

        const existingEstablishmentAdminRight: EstablishmentAdminRight = {
          userId: inclusionConnectedUser.id,
          role: "establishment-admin",
          job: "new job",
          phone: "+33612345679",
        };

        uow.establishmentAggregateRepository.establishmentAggregates = [
          {
            ...existingEstablishmentAggregate,
            userRights: [
              existingEstablishmentAdminRight,
              {
                userId: establishmentContactUser.id,
                role: "establishment-contact",
              },
            ],
          },
        ];

        const updatedFormEstablishmentWithUserRights: FormEstablishmentDto = {
          ...updatedFormEstablishment,
          userRights: [
            {
              role: existingEstablishmentAdminRight.role,
              email: inclusionConnectedUser.email,
              job: existingEstablishmentAdminRight.job,
              phone: existingEstablishmentAdminRight.phone,
            },
          ],
        };

        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishmentWithUserRights },
          {
            userId: establishmentContactUser.id,
          },
        );

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            {
              ...updatedEstablishmentAggregate,
              userRights: [existingEstablishmentAdminRight],
            },
          ],
        );

        expectSavedNotificationsAndEvents({
          emails: [],
        });
      });
    });
  });
});
