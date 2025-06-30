import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  getFormattedFirstnameAndLastname,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import type { TransferConventionToAgencyPayload } from "../../../core/events/eventPayload.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type NotifyAllActorsThatConventionTransferred,
  makeNotifyAllActorsThatConventionTransferred,
} from "./NotifyAllActorsThatConventionTransferred";

describe("NotifyAllActorsThatConventionTransferred", () => {
  const previousAgency = new AgencyDtoBuilder()
    .withId("previous-agency")
    .build();
  const newAgency = new AgencyDtoBuilder().withId("new-agency").build();
  const convention = new ConventionDtoBuilder()
    .withAgencyId(newAgency.id)
    .withEstablishmentTutor({
      email: "establishment-tutor@example.com",
      firstName: "Establishment",
      lastName: "Tutor",
      phone: "0606060606",
      role: "establishment-tutor",
      job: "Job",
    })
    .withEstablishmentRepresentative({
      email: "establishment-representative@example.com",
      firstName: "Establishment",
      lastName: "Representative",
      phone: "0606060606",
      role: "establishment-representative",
    })
    .build();
  const connectedUserPayload: InclusionConnectDomainJwtPayload = {
    userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
  };

  const connectedUser = new InclusionConnectedUserBuilder()
    .withId(connectedUserPayload.userId)
    .build();
  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let usecase: NotifyAllActorsThatConventionTransferred;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();

    usecase = makeNotifyAllActorsThatConventionTransferred({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new UuidV4Generator(),
          new CustomTimeGateway(),
        ),
        timeGateway,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        shortLinkIdGeneratorGateway,
        config,
      },
    });
  });

  it("throw if new agency not found", async () => {
    uow.agencyRepository.agencies = [toAgencyWithRights(previousAgency, {})];
    const input: TransferConventionToAgencyPayload = {
      agencyId: newAgency.id,
      conventionId: convention.id,
      justification: "agency change",
      previousAgencyId: previousAgency.id,
    };

    await expectPromiseToFailWithError(
      usecase.execute(input),
      errors.agency.notFound({ agencyId: newAgency.id }),
    );
  });

  it("throw if previous agency not found", async () => {
    const input: TransferConventionToAgencyPayload = {
      agencyId: newAgency.id,
      conventionId: convention.id,
      justification: "agency change",
      previousAgencyId: previousAgency.id,
    };

    await expectPromiseToFailWithError(
      usecase.execute(input),
      errors.agency.notFound({ agencyId: previousAgency.id }),
    );
  });

  it("throw if convention not found", async () => {
    uow.agencyRepository.agencies = [
      toAgencyWithRights(previousAgency, {}),
      toAgencyWithRights(newAgency, {}),
    ];

    const input: TransferConventionToAgencyPayload = {
      agencyId: newAgency.id,
      conventionId: convention.id,
      justification: "agency change",
      previousAgencyId: previousAgency.id,
    };

    await expectPromiseToFailWithError(
      usecase.execute(input),
      errors.convention.notFound({ conventionId: convention.id }),
    );
  });

  it("should notify agency and signatories that convention has been transferred", async () => {
    const shortLinks = ["shortLink1", "shortLink2", "shortLink3", "shortLink4"];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(previousAgency, {}),
      toAgencyWithRights(newAgency, {
        [connectedUser.id]: {
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      }),
    ];
    uow.userRepository.users = [connectedUser];
    uow.conventionRepository.setConventions([convention]);

    await usecase.execute({
      agencyId: newAgency.id,
      conventionId: convention.id,
      justification: "agency change",
      previousAgencyId: previousAgency.id,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
          recipients: [connectedUser.email],
          params: {
            internshipKind: convention.internshipKind,
            beneficiaryEmail: convention.signatories.beneficiary.email,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            beneficiaryPhone: convention.signatories.beneficiary.phone,
            previousAgencyName: previousAgency.name,
            justification: "agency change",
            magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[0]}`,
            conventionId: convention.id,
          },
        },
        {
          kind: "CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION",
          recipients: [convention.signatories.beneficiary.email],
          params: {
            internshipKind: convention.internshipKind,
            immersionProfession:
              convention.immersionAppellation.appellationLabel,
            previousAgencyName: previousAgency.name,
            newAgencyName: newAgency.name,
            agencyAddress: `${newAgency.address.streetNumberAndAddress} ${newAgency.address.postcode} ${newAgency.address.city}`,
            businessName: convention.businessName,
            justification: "agency change",
            magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[1]}`,
            conventionId: convention.id,
          },
        },
        {
          kind: "CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION",
          recipients: [
            convention.signatories.establishmentRepresentative.email,
          ],
          params: {
            internshipKind: convention.internshipKind,
            immersionProfession:
              convention.immersionAppellation.appellationLabel,
            previousAgencyName: previousAgency.name,
            newAgencyName: newAgency.name,
            agencyAddress: `${newAgency.address.streetNumberAndAddress} ${newAgency.address.postcode} ${newAgency.address.city}`,
            businessName: convention.businessName,
            justification: "agency change",
            magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[2]}`,
            conventionId: convention.id,
          },
        },
        {
          kind: "CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION",
          recipients: [convention.establishmentTutor.email],
          params: {
            internshipKind: convention.internshipKind,
            immersionProfession:
              convention.immersionAppellation.appellationLabel,
            previousAgencyName: previousAgency.name,
            newAgencyName: newAgency.name,
            agencyAddress: `${newAgency.address.streetNumberAndAddress} ${newAgency.address.postcode} ${newAgency.address.city}`,
            businessName: convention.businessName,
            justification: "agency change",
            magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[3]}`,
            conventionId: convention.id,
          },
        },
      ],
    });
  });
});
