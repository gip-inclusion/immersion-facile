import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  Signatories,
  TemplatedEmail,
  UpdateConventionStatusRequestDto,
  VALID_EMAILS,
  conventionMagicLinkRoutes,
  expectArraysToEqualIgnoringOrder,
  expectEmailOfType,
  expectJwtInMagicLinkAndGetIt,
  expectToEqual,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import { createSupertestSharedClient } from "shared-routes/supertest";
import supertest from "supertest";
import { InMemoryOutboxRepository } from "../../../../domains/core/events/adapters/InMemoryOutboxRepository";
import { DomainEvent } from "../../../../domains/core/events/events";
import { InMemoryNotificationGateway } from "../../../../domains/core/notifications/adapters/InMemoryNotificationGateway";
import { TestAppAndDeps, buildTestApp } from "../../../../utils/buildTestApp";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

const validatorEmail = "validator@mail.com";
const beneficiarySubmitDate = new Date();
beneficiarySubmitDate.setDate(beneficiarySubmitDate.getDate() - 3);
const beneficiarySignDate = new Date();
beneficiarySignDate.setDate(beneficiarySignDate.getDate() - 2);
const establishmentRepresentativeSignDate = new Date();
establishmentRepresentativeSignDate.setDate(
  establishmentRepresentativeSignDate.getDate() - 1,
);
const validationDate = new Date();
const externalId = "00000000005";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid app in repository with full express app", async () => {
    const validConvention = new ConventionDtoBuilder().build();
    const { request, gateways, eventCrawler, inMemoryUow } =
      await buildTestApp();

    gateways.shortLinkGenerator.addMoreShortLinkIds([
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
      "shortLink5",
      "shortLink6",
    ]);

    const res = await request
      .post(unauthenticatedConventionRoutes.createConvention.url)
      .send({ convention: validConvention });

    expectResponseBody(res, { id: validConvention.id });
    expect(
      await inMemoryUow.conventionRepository.getById(validConvention.id),
    ).toEqual(validConvention);
    expectEventsInOutbox(inMemoryUow.outboxRepository, [
      {
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention: validConvention, triggeredBy: undefined },
        publications: [],
      },
    ]);

    // 1. initial submission, needs PE bind usecase
    await eventCrawler.processNewEvents();
    // 2. actual processing of the event
    await processEventsForEmailToBeSent(eventCrawler);

    expectSentEmails(gateways.notification, [
      { kind: "NEW_CONVENTION_AGENCY_NOTIFICATION" },
      {
        kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [validConvention.signatories.beneficiary.email],
      },
      {
        kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [
          validConvention.signatories.establishmentRepresentative.email,
        ],
      },
    ]);
  });

  // eslint-disable-next-line jest/expect-expect
  it("Scenario: convention submitted, then signed, then validated", async () => {
    const peAgency = new AgencyDtoBuilder()
      .withKind("pole-emploi")
      .withValidatorEmails(["validator@mail.com"])
      .build();

    const initialConvention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .notSigned()
      .withStatus("READY_TO_SIGN")
      .withoutDateValidation()
      .withFederatedIdentity({ provider: "peConnect", token: "fake" })
      .build();

    const appAndDeps = await buildTestApp();
    appAndDeps.gateways.timeGateway.defaultDate = new Date();
    appAndDeps.gateways.shortLinkGenerator.addMoreShortLinkIds([
      "link1",
      "link2",
      "link3",
      "link4",
      "link5",
      "link6",
      "link7",
      "link8",
    ]);

    appAndDeps.inMemoryUow.agencyRepository.setAgencies([peAgency]);

    appAndDeps.inMemoryUow.conventionExternalIdRepository.nextExternalId =
      externalId;

    const { beneficiarySignJwt, establishmentSignJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        initialConvention,
        beneficiarySubmitDate,
      );

    await beneficiarySignsApplication(
      appAndDeps,
      beneficiarySignJwt,
      initialConvention,
    );

    const { validatorReviewJwt } = await establishmentSignsApplication(
      appAndDeps,
      establishmentSignJwt,
      initialConvention,
    );

    await validatorValidatesApplicationWhichTriggersConventionToBeSent(
      appAndDeps,
      validatorReviewJwt,
      initialConvention,
    );

    // REVIEW : RAJOUTER EXPECT A FAIRE !!!
  });

  const expectSentEmails = (
    notificationGateway: InMemoryNotificationGateway,
    emails: Partial<TemplatedEmail>[],
  ) => {
    expect(notificationGateway.getSentEmails()).toMatchObject(emails);
  };

  const expectEventsInOutbox = (
    outbox: InMemoryOutboxRepository,
    events: Partial<DomainEvent>[],
  ) => {
    expect(outbox.events).toMatchObject(events);
  };

  const expectResponseBody = (
    res: supertest.Response,
    body: Record<string, unknown>,
  ) => {
    expect(res.body).toEqual(body);
    expect(res.status).toBe(200);
  };
});

const numberOfEmailInitialySent = 4;

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  convention: ConventionDto,
  submitDate: Date,
) => {
  const technicalRoutesClient = createSupertestSharedClient(
    technicalRoutes,
    request,
  );
  gateways.timeGateway.setNextDate(submitDate);
  gateways.shortLinkGenerator.addMoreShortLinkIds([
    "shortLink1",
    "shortLink2",
    "shortLink3",
    "shortLink4",
  ]);

  const result = await request
    .post(unauthenticatedConventionRoutes.createConvention.url)
    .send({ convention });

  expect(result.status).toBe(200);

  expectToEqual(
    await inMemoryUow.conventionRepository.getById(convention.id),
    convention,
  );

  // needs extra processing to bind PE connect
  await eventCrawler.processNewEvents();
  await processEventsForEmailToBeSent(eventCrawler);

  expect(inMemoryUow.notificationRepository.notifications).toHaveLength(3);
  const peNotification = gateways.poleEmploiGateway.notifications[0];
  expect(peNotification.id).toBe(externalId);
  expectToEqual(peNotification.statut, "DEMANDE_A_SIGNER");
  expect(peNotification.originalId).toBe(convention.id);
  expect(peNotification.email).toBe(convention.signatories.beneficiary.email);
  const sentEmails = gateways.notification.getSentEmails();
  expect(sentEmails).toHaveLength(numberOfEmailInitialySent - 1);
  expectArraysToEqualIgnoringOrder(
    sentEmails.map((e) => e.recipients),
    [[VALID_EMAILS[2]], [VALID_EMAILS[0]], [VALID_EMAILS[1]]],
  );

  const beneficiaryShortLinkSignEmail = expectEmailOfType(
    sentEmails[1],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );
  const establishmentShortLinkSignEmail = expectEmailOfType(
    sentEmails[2],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );

  const beneficiarySignLink = await shortLinkRedirectToLinkWithValidation(
    beneficiaryShortLinkSignEmail.params.conventionSignShortlink,
    technicalRoutesClient,
  );

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentShortLinkSignEmail.params.conventionSignShortlink,
    technicalRoutesClient,
  );

  const beneficiarySignJwt = expectJwtInMagicLinkAndGetIt(beneficiarySignLink);
  const establishmentSignJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignLink,
  );

  return {
    beneficiarySignJwt,
    establishmentSignJwt,
  };
};

const beneficiarySignsApplication = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  beneficiarySignJwt: string,
  initialConvention: ConventionDto,
) => {
  gateways.timeGateway.setNextDate(beneficiarySignDate);

  const response = await request
    .post(
      conventionMagicLinkRoutes.signConvention.url.replace(
        ":conventionId",
        initialConvention.id,
      ),
    )
    .set("Authorization", beneficiarySignJwt);

  expect(response.status).toBe(200);

  expectToEqual(
    await inMemoryUow.conventionRepository.getById(initialConvention.id),
    {
      ...initialConvention,
      status: "PARTIALLY_SIGNED",
      signatories: makeSignatories(initialConvention, {
        beneficiarySignedAt: beneficiarySignDate.toISOString(),
      }),
    },
  );

  await processEventsForEmailToBeSent(eventCrawler);

  const sentEmails = gateways.notification.getSentEmails();
  expect(sentEmails).toHaveLength(numberOfEmailInitialySent);
};

const establishmentSignsApplication = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  establishmentSignJwt: string,
  initialConvention: ConventionDto,
) => {
  const technicalRoutesClient = createSupertestSharedClient(
    technicalRoutes,
    request,
  );
  gateways.timeGateway.setNextDate(establishmentRepresentativeSignDate);

  await request
    .post(
      conventionMagicLinkRoutes.signConvention.url.replace(
        ":conventionId",
        initialConvention.id,
      ),
    )
    .set("Authorization", establishmentSignJwt)
    .expect(200);

  expectToEqual(
    await inMemoryUow.conventionRepository.getById(initialConvention.id),
    {
      ...initialConvention,
      status: "IN_REVIEW",
      signatories: makeSignatories(initialConvention, {
        beneficiarySignedAt: beneficiarySignDate.toISOString(),
        establishmentRepresentativeSignedAt:
          establishmentRepresentativeSignDate.toISOString(),
      }),
    },
  );

  await processEventsForEmailToBeSent(eventCrawler);

  const sentEmails = gateways.notification.getSentEmails();
  expect(sentEmails.map((email) => email.kind)).toStrictEqual([
    "NEW_CONVENTION_AGENCY_NOTIFICATION",
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
    "SIGNEE_HAS_SIGNED_CONVENTION",
    "SIGNEE_HAS_SIGNED_CONVENTION",
    "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
  ]);

  const needsReviewEmail = expectEmailOfType(
    sentEmails[sentEmails.length - 1],
    "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
  );
  expect(needsReviewEmail.recipients).toEqual([validatorEmail]);

  return {
    validatorReviewJwt: expectJwtInMagicLinkAndGetIt(
      await shortLinkRedirectToLinkWithValidation(
        needsReviewEmail.params.magicLink,
        technicalRoutesClient,
      ),
    ),
  };
};

const validatorValidatesApplicationWhichTriggersConventionToBeSent = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  validatorReviewJwt: string,
  initialConvention: ConventionDto,
) => {
  const technicalRoutesClient = createSupertestSharedClient(
    technicalRoutes,
    request,
  );
  const params: UpdateConventionStatusRequestDto = {
    status: "ACCEPTED_BY_VALIDATOR",
    conventionId: initialConvention.id,
    firstname: "John",
    lastname: "Doe",
  };

  gateways.timeGateway.setNextDate(validationDate);
  gateways.shortLinkGenerator.addMoreShortLinkIds(["shortlinkId"]);

  await request
    .post(
      conventionMagicLinkRoutes.updateConventionStatus.url.replace(
        ":conventionId",
        initialConvention.id,
      ),
    )
    .set("Authorization", validatorReviewJwt)
    .send(params)
    .expect(200);

  expectToEqual(
    await inMemoryUow.conventionRepository.getById(initialConvention.id),
    {
      ...initialConvention,
      status: "ACCEPTED_BY_VALIDATOR",
      dateValidation: validationDate.toISOString(),
      signatories: makeSignatories(initialConvention, {
        beneficiarySignedAt: beneficiarySignDate.toISOString(),
        establishmentRepresentativeSignedAt:
          establishmentRepresentativeSignDate.toISOString(),
      }),
      validators: {
        agencyValidator: {
          firstname: params.firstname,
          lastname: params.lastname,
        },
      },
      statusJustification: undefined,
    },
  );

  await processEventsForEmailToBeSent(eventCrawler);

  const sentEmails = gateways.notification.getSentEmails();
  expect(sentEmails.map((email) => email.kind)).toStrictEqual([
    "NEW_CONVENTION_AGENCY_NOTIFICATION",
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
    "SIGNEE_HAS_SIGNED_CONVENTION",
    "SIGNEE_HAS_SIGNED_CONVENTION",
    "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  ]);

  const needsToTriggerConventionSentEmail = expectEmailOfType(
    sentEmails[sentEmails.length - 1],
    "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  );
  expect(needsToTriggerConventionSentEmail.recipients).toEqual([
    validatorEmail,
  ]);

  expectJwtInMagicLinkAndGetIt(
    await shortLinkRedirectToLinkWithValidation(
      needsToTriggerConventionSentEmail.params.magicLink,
      technicalRoutesClient,
    ),
  );
};

const makeSignatories = (
  convention: ConventionDto,
  {
    establishmentRepresentativeSignedAt,
    beneficiarySignedAt,
  }: {
    establishmentRepresentativeSignedAt?: string;
    beneficiarySignedAt?: string;
  },
): Signatories => ({
  beneficiary: {
    ...convention.signatories.beneficiary,
    signedAt: beneficiarySignedAt,
  },
  establishmentRepresentative: {
    ...convention.signatories.establishmentRepresentative,
    signedAt: establishmentRepresentativeSignedAt,
  },
});
