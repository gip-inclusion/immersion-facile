import { addDays } from "date-fns";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyRole,
  type ConventionDto,
  ConventionDtoBuilder,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  UserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import {
  type SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
  type SendAssessmentLink,
  makeSendAssessmentLink,
} from "./SendAssessmentLink";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const notConnectedUser = new UserBuilder()
  .withEmail("validator@mail.com")
  .build();
const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: notConnectedUser.email,
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUserBuilder = new InclusionConnectedUserBuilder().withId(
  connectedUserPayload.userId,
);
const connectedUser = connectedUserBuilder.build();

describe("wrong paths", () => {
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: SendAssessmentLink;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let timeGateway: TimeGateway;
  let convention: ConventionDto;
  let agency: AgencyDto;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    const createNewEvent = makeCreateNewEvent({ uuidGenerator, timeGateway });

    usecase = makeSendAssessmentLink({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway,
        config,
        createNewEvent,
      },
    });

    convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateEnd(timeGateway.now().toISOString())
      .build();

    agency = new AgencyDtoBuilder().withId(convention.agencyId).build();
  });

  it("throws bad request if requested convention does not match the one in jwt", async () => {
    const requestedConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

    await expectPromiseToFailWithError(
      usecase.execute(
        {
          conventionId: requestedConventionId,
        },
        validatorJwtPayload,
      ),
      errors.convention.forbiddenMissingRights({
        conventionId: requestedConventionId,
      }),
    );
  });

  it("throws not found if convention does not exist", async () => {
    await expectPromiseToFailWithError(
      usecase.execute(
        {
          conventionId,
        },
        validatorJwtPayload,
      ),
      errors.convention.notFound({
        conventionId,
      }),
    );
  });

  it("throws bad request if status is not ACCEPTED_BY_VALIDATOR", async () => {
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("IN_REVIEW")
      .build();
    uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
    uow.conventionRepository.setConventions([convention]);

    await expectPromiseToFailWithError(
      usecase.execute(
        {
          conventionId,
        },
        validatorJwtPayload,
      ),
      errors.assessment.sendAssessmentLinkNotAllowedForStatus({
        status: "IN_REVIEW",
      }),
    );
  });

  it("throws bad request if immersion ends in more than 1 day", async () => {
    const today = timeGateway.now();
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateEnd(addDays(today, 2).toISOString())
      .build();
    uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
    uow.conventionRepository.setConventions([convention]);

    await expectPromiseToFailWithError(
      usecase.execute(
        {
          conventionId,
        },
        validatorJwtPayload,
      ),
      errors.assessment.conventionEndingInMoreThanOneDay(),
    );
  });

  it("throws bad request if assessment is already filled", async () => {
    uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
    uow.conventionRepository.setConventions([convention]);
    uow.assessmentRepository.save({
      conventionId: conventionId,
      status: "COMPLETED",
      endedWithAJob: false,
      establishmentFeedback: "establishmentFeedback",
      establishmentAdvices: "establishmentAdvices",
      numberOfHoursActuallyMade: 10,
      _entityName: "Assessment",
    });

    await expectPromiseToFailWithError(
      usecase.execute(
        {
          conventionId,
        },
        validatorJwtPayload,
      ),
      errors.assessment.assessmentAlreadyFullfilled(conventionId),
    );
  });

  describe("from connected user", () => {
    it("throws not found if connected user id does not exist", async () => {
      const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
        userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
      };
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
      uow.conventionRepository.setConventions([convention]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
          },
          unexistingUserPayload,
        ),
        errors.user.notFound(unexistingUserPayload),
      );
    });

    it.each(["agency-admin", "agency-viewer", "to-review"] as AgencyRole[])(
      "throws unauthorized if agency user has not enough rights on convention",
      async (role) => {
        uow.userRepository.users = [connectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUser.id]: { roles: [role], isNotifiedByEmail: true },
          }),
        ];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
            },
            connectedUserPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            userId: connectedUser.id,
            agencyId: agency.id,
          }),
        );
      },
    );

    it.each([
      "establishment-admin",
      "establishment-contact",
    ] as EstablishmentRole[])(
      "throws unauthorized if establishment user has not enough rights on convention",
      async (role) => {
        uow.userRepository.users = [connectedUser];
        const userRights: EstablishmentUserRight[] = [
          {
            userId: connectedUser.id,
            role,
            job: "job",
            phone: "phone",
          },
        ];
        const establishmentAggregateWithEmail =
          new EstablishmentAggregateBuilder()
            .withUserRights(userRights)
            .build();
        await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregateWithEmail,
        );
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
            },
            connectedUserPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            userId: connectedUser.id,
            agencyId: agency.id,
          }),
        );
      },
    );

    it("throws unauthorized if signatory has no rights on convention", async () => {});
  });

  describe("from magiclink", () => {
    it.each(["agency-admin", "agency-viewer", "to-review"])(
      "throws unauthorized if user has not enough rights on agency",
      async () => {},
    );

    it("throws unauthorized if signatory has no rights on convention", async () => {}); //validator mais pas sur l'agence de la convention

    it(`throws too many requests if there was already a signature link sent less than ${MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER} hours before`, async () => {});
  });
});

describe("right paths: send assessment link", () => {
  it.each(["validator", "counsellor"] as const)(
    "when agency user %s triggers it",
    () => {},
  );

  it.each([
    "beneficiary",
    "establishment-representative",
    "beneficiary-current-employer",
    "beneficiary-representative",
  ] as const)("when signatory %s triggers it", () => {});
});
