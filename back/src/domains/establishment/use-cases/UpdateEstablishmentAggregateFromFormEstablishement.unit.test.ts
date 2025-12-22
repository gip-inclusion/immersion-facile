import {
  type AbsoluteUrl,
  type AdminFormEstablishmentUserRight,
  addressDtoToString,
  ConnectedUserBuilder,
  type ConnectedUserDomainJwtPayload,
  type ContactFormEstablishmentUserRight,
  defaultAddress,
  defaultCountryCode,
  type EstablishmentFormOffer,
  errors,
  expectObjectInArrayToMatch,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  type SiretDto,
  UserBuilder,
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
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
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
  const immersionBaseUrl: AbsoluteUrl = "https://immersion-base-url.com";

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
        immersionBaseUrl,
      );
  });

  it("Fails if establishment does not exists amongst aggregates", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [];
    const user = new ConnectedUserBuilder().buildUser();
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
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
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
            address: {
              ...rueGuillaumeTellDto,
              countryCode: defaultCountryCode,
            },
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

    const updatedOffer: EstablishmentFormOffer = {
      romeLabel: "Boulangerie",
      appellationLabel: "Boulanger",
      romeCode: "A1101",
      appellationCode: "22222",
      remoteWorkMode: "NO_REMOTE",
    };
    const nextAvailabilityDate = new Date();
    const updatedFormAdmin: AdminFormEstablishmentUserRight = {
      role: "establishment-admin",
      email: newEstablishmentAdmin.email,
      job: "new job",
      phone: "+33677445511",
      shouldReceiveDiscussionNotifications: true,
      isMainContactByPhone: false,
    };
    const updatedFormContact: ContactFormEstablishmentUserRight = {
      role: "establishment-contact",
      email: newEstablishmentContact.email,
      shouldReceiveDiscussionNotifications: true,
    };
    const updatedFormEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withOffers([updatedOffer])
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
                .withRomeLabel(updatedOffer.romeLabel)
                .withRomeCode(updatedOffer.romeCode)
                .withAppellationCode(updatedOffer.appellationCode)
                .withAppellationLabel(updatedOffer.appellationLabel)
                .withCreatedAt(timeGateway.now())
                .build(),
            ])
            .withUserRights([
              {
                role: "establishment-admin",
                userId: newEstablishmentAdmin.id,
                job: updatedFormAdmin.job,
                phone: updatedFormAdmin.phone,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                userId: newEstablishmentContact.id,
                shouldReceiveDiscussionNotifications: true,
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
              kind: "connected-user",
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
                .withRomeLabel(updatedOffer.romeLabel)
                .withRomeCode(updatedOffer.romeCode)
                .withAppellationCode(updatedOffer.appellationCode)
                .withAppellationLabel(updatedOffer.appellationLabel)
                .withCreatedAt(timeGateway.now())
                .build(),
            ])
            .withUserRights([
              {
                role: "establishment-admin",
                userId: newEstablishmentAdmin.id,
                job: updatedFormAdmin.job,
                phone: updatedFormAdmin.phone,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                userId: newEstablishmentContact.id,
                shouldReceiveDiscussionNotifications: true,
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
              kind: "connected-user",
              userId: previousEstablishmentAdmin.id,
            },
          },
        },
      ]);
    });

    it("When users don't have discussion notifications, throw an error", async () => {
      const updatedFormEstablishmentWithNoDiscussionNotifications = {
        ...updatedFormEstablishment,
        userRights: [
          {
            ...updatedFormAdmin,
            shouldReceiveDiscussionNotifications: false,
          },
          {
            ...updatedFormContact,
            shouldReceiveDiscussionNotifications: false,
          },
        ],
      };

      await expectPromiseToFailWithError(
        updateEstablishmentAggregateFromFormUseCase.execute(
          {
            formEstablishment:
              updatedFormEstablishmentWithNoDiscussionNotifications,
          },
          { userId: previousEstablishmentAdmin.id },
        ),
        errors.inputs.badSchema({
          useCaseName: "UpdateEstablishmentAggregateFromForm",
          id: siret,
          flattenErrors: [
            "formEstablishment.userRights : La structure accueillante nécessite au moins qu'une personne reçoive les notifications liées aux candidatures.",
          ],
        }),
      );
    });
  });

  describe("Behavior of EditFormEstablishment", () => {
    let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
    const existingFormEstablishment =
      FormEstablishmentDtoBuilder.valid().build();
    const updatedFormEstablishment = FormEstablishmentDtoBuilder.fullyUpdated()
      .withSiret(existingFormEstablishment.siret)
      .build();

    const backofficeAdminUserBuilder = new ConnectedUserBuilder().withIsAdmin(
      true,
    );
    const connectedBackofficeAdminUser = backofficeAdminUserBuilder.build();
    const backofficeAdminUser = backofficeAdminUserBuilder.buildUser();

    const userBuilder = new ConnectedUserBuilder()
      .withId("connected-user")
      .withIsAdmin(false);
    const connectedUser = userBuilder.build();
    const user = userBuilder.buildUser();

    const connectedUserJwtPayload: ConnectedUserDomainJwtPayload = {
      userId: connectedUser.id,
    };

    const existingEstablishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(existingFormEstablishment.siret)
          .withName(existingFormEstablishment.businessName)
          .withSearchableBy(existingFormEstablishment.searchableBy)
          .withContactMode(existingFormEstablishment.contactMode)
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
          userId: user.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    const newAdminRight: EstablishmentAdminRight = {
      role: "establishment-admin",
      job: "new job",
      phone: "+33612345679",
      userId: "nextuser1",
      shouldReceiveDiscussionNotifications: true,
      isMainContactByPhone: true,
    };
    const newContactRight: EstablishmentContactRight = {
      role: "establishment-contact",
      userId: "nextuser2",
      shouldReceiveDiscussionNotifications: false,
    };
    const updatedEstablishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(updatedFormEstablishment.siret)
          .withName(updatedFormEstablishment.businessName)
          .withSearchableBy(updatedFormEstablishment.searchableBy)
          .withContactMode(updatedFormEstablishment.contactMode)
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
        updatedFormEstablishment.offers.map((offer) => ({
          ...offer,
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
        [
          {
            ...updatedAddress1.addressAndPosition,
            address: {
              ...updatedAddress1.addressAndPosition.address,
              countryCode: defaultCountryCode,
            },
          },
        ],
        [
          {
            ...updatedAddress2.addressAndPosition,
            address: {
              ...updatedAddress2.addressAndPosition.address,
              countryCode: defaultCountryCode,
            },
          },
        ],
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
            connectedUserJwtPayload,
          ),
          errors.user.notFound({ userId: connectedUserJwtPayload.userId }),
        );
      });

      it("Forbidden error on ConnectedUserJwtPayload with ic user that doesn't have rights on establishment", async () => {
        uow.userRepository.users = [user];
        uow.establishmentAggregateRepository.establishmentAggregates = [
          { ...existingEstablishmentAggregate, userRights: [] },
        ];

        await expectPromiseToFailWithError(
          updateEstablishmentAggregateFromFormUseCase.execute(
            { formEstablishment: updatedFormEstablishment },
            connectedUserJwtPayload,
          ),
          errors.user.forbidden({ userId: connectedUser.id }),
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
            connectedUserJwtPayload,
          ),
          errors.establishment.notFound({
            siret: updatedFormEstablishment.siret,
          }),
        );
      });
    });

    describe("Right paths", () => {
      it("publish a FormEstablishmentEdited event & update formEstablishment on repository with an connected user payload", async () => {
        uow.userRepository.users = [user];
        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishment },
          connectedUserJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UpdatedEstablishmentAggregateInsertedFromForm",
            payload: {
              siret: updatedFormEstablishment.siret,
              triggeredBy: {
                kind: "connected-user",
                userId: connectedUserJwtPayload.userId,
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
            userId: connectedBackofficeAdminUser.id,
          },
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UpdatedEstablishmentAggregateInsertedFromForm",
            payload: {
              siret: updatedFormEstablishment.siret,
              triggeredBy: {
                kind: "connected-user",
                userId: connectedBackofficeAdminUser.id,
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
        uow.userRepository.users = [user];
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
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: true,
        };
        const updatedFormEstablishmentWithUserRights: FormEstablishmentDto = {
          ...updatedFormEstablishment,
          userRights: [
            {
              role: "establishment-contact",
              email: user.email,
              shouldReceiveDiscussionNotifications: true,
            },
            {
              role: newAdminRight.role,
              email: newAdminEmail,
              job: newAdminRight.job,
              phone: newAdminRight.phone,
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: true,
            },
          ],
        };
        await updateEstablishmentAggregateFromFormUseCase.execute(
          { formEstablishment: updatedFormEstablishmentWithUserRights },
          {
            userId: user.id,
          },
        );

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            {
              ...updatedEstablishmentAggregate,
              userRights: [
                {
                  userId: user.id,
                  role: "establishment-contact",
                  shouldReceiveDiscussionNotifications: true,
                },
                newAdminRight,
              ],
            },
          ],
        );

        expectObjectsToMatch(uow.userRepository.users, [
          user,
          {
            id: newAdminRight.userId,
            email: newAdminEmail,
            firstName: "",
            lastName: "",
            createdAt: now.toISOString(),
            proConnect: null,
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
                triggeredByUserFirstName:
                  connectedBackofficeAdminUser.firstName,
                triggeredByUserLastName: connectedBackofficeAdminUser.lastName,
                role: "establishment-admin",
                immersionBaseUrl,
              },
              recipients: [newAdminEmail],
            },
            {
              kind: "ESTABLISHMENT_USER_RIGHTS_UPDATED",
              params: {
                businessName:
                  updatedFormEstablishmentWithUserRights.businessNameCustomized ??
                  updatedFormEstablishmentWithUserRights.businessName,
                firstName: user.firstName,
                lastName: user.lastName,
                triggeredByUserFirstName:
                  connectedBackofficeAdminUser.firstName,
                triggeredByUserLastName: connectedBackofficeAdminUser.lastName,
                updatedRole: "establishment-contact",
              },
              recipients: [user.email],
            },
          ],
        });
      });

      it("doesn't send any notification if userRight is not updated or deleted with a IC payload with user with establishment-admin rights", async () => {
        const establishmentContactUser = new UserBuilder()
          .withId("establishment-contact-user")
          .withEmail("establishment-contact@gmail.com")
          .build();
        uow.userRepository.users = [user, establishmentContactUser];

        const existingEstablishmentAdminRight: EstablishmentAdminRight = {
          userId: user.id,
          role: "establishment-admin",
          job: "new job",
          phone: "+33612345679",
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: true,
        };

        const existingEstablishmentContactRight: EstablishmentContactRight = {
          userId: establishmentContactUser.id,
          role: "establishment-contact",
          shouldReceiveDiscussionNotifications: true,
        };

        uow.establishmentAggregateRepository.establishmentAggregates = [
          {
            ...existingEstablishmentAggregate,
            userRights: [
              existingEstablishmentAdminRight,
              existingEstablishmentContactRight,
            ],
          },
        ];

        const updatedFormEstablishmentWithUserRights: FormEstablishmentDto = {
          ...updatedFormEstablishment,
          userRights: [
            {
              ...existingEstablishmentAdminRight,
              email: user.email,
            },
            {
              email: establishmentContactUser.email,
              role: existingEstablishmentContactRight.role,
              shouldReceiveDiscussionNotifications:
                existingEstablishmentContactRight.shouldReceiveDiscussionNotifications,
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
              userRights: [
                existingEstablishmentAdminRight,
                existingEstablishmentContactRight,
              ],
            },
          ],
        );

        expectSavedNotificationsAndEvents({
          emails: [],
        });
      });

      it("updates offer remote work mode of an establishment aggregate", async () => {
        uow.userRepository.users = [user];
        const initialOffer = updatedFormEstablishment.offers[0];
        const updatedOffer: EstablishmentFormOffer = {
          ...initialOffer,
          remoteWorkMode: "100% REMOTE",
        };
        const updatedFormEstablishmentWithOfferRemoteWorkMode: FormEstablishmentDto =
          {
            ...updatedFormEstablishment,
            offers: [updatedOffer],
          };
        const expectedEstablishmentAggregate = {
          ...updatedEstablishmentAggregate,
          offers: [
            {
              ...updatedOffer,
              createdAt: timeGateway.now(),
            },
          ],
        };
        await updateEstablishmentAggregateFromFormUseCase.execute(
          {
            formEstablishment: updatedFormEstablishmentWithOfferRemoteWorkMode,
          },
          {
            userId: user.id,
          },
        );

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            {
              ...updatedEstablishmentAggregate,
              offers: expectedEstablishmentAggregate.offers,
            },
          ],
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UpdatedEstablishmentAggregateInsertedFromForm",
            payload: {
              siret: expectedEstablishmentAggregate.establishment.siret,
              triggeredBy: {
                kind: "connected-user",
                userId: user.id,
              },
            },
          },
        ]);

        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [expectedEstablishmentAggregate],
        );
      });
    });
  });
});
