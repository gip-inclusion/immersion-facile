import supertest from "supertest";
import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import {
  ImmersionApplicationDtoBuilder,
  VALID_EMAILS,
} from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../adapters/secondary/InMemoryEmailGateway";
import { DomainEvent } from "../../domain/core/eventBus/events";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import {
  ImmersionApplicationDto,
  UpdateImmersionApplicationStatusRequestDto,
} from "../../shared/ImmersionApplication/ImmersionApplication.dto";
import {
  immersionApplicationsRoute,
  signApplicationRoute,
  updateApplicationStatusRoute,
} from "../../shared/routes";

const adminEmail = "admin@email.fr";
const validatorEmail = "validator@mail.com";

describe("Add immersionApplication Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid app in repository with full express app", async () => {
    const validImmersionApplication =
      new ImmersionApplicationDtoBuilder().build();
    const { request, reposAndGateways, eventCrawler } = await buildTestApp();

    const res = await request
      .post(`/${immersionApplicationsRoute}`)
      .send(validImmersionApplication);

    expectResponseBody(res, { id: validImmersionApplication.id });
    expect(await reposAndGateways.immersionApplication.getAll()).toEqual([
      ImmersionApplicationEntity.create(validImmersionApplication),
    ]);
    expectEventsInOutbox(reposAndGateways.outbox, [
      {
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validImmersionApplication,
        wasPublished: false,
      },
    ]);

    await eventCrawler.processEvents();

    expectSentEmails(reposAndGateways.email, [
      {
        type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [validImmersionApplication.email],
      },
      {
        type: "NEW_APPLICATION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [validImmersionApplication.mentorEmail],
      },
      {
        type: "NEW_APPLICATION_ADMIN_NOTIFICATION",
        recipients: ["admin@email.fr"],
      },
    ]);
  });

  // eslint-disable-next-line jest/expect-expect
  it("Scenario: application submitted, then signed, then validated", async () => {
    const initialImmersionApplication = new ImmersionApplicationDtoBuilder()
      .notSigned()
      .withStatus("READY_TO_SIGN")
      .build();

    const appAndDeps = await buildTestApp();
    const agency = await appAndDeps.reposAndGateways.agency.getById(
      initialImmersionApplication.agencyId,
    );

    if (!agency) throw new Error("Test agency not found with this id");

    appAndDeps.reposAndGateways.agency.setAgencies([
      { ...agency, validatorEmails: ["validator@mail.com"] },
    ]);

    const { beneficiarySignJwt, establishmentSignJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        initialImmersionApplication,
      );

    await beneficiarySignsApplication(
      appAndDeps,
      beneficiarySignJwt,
      initialImmersionApplication,
    );

    const { validatorReviewJwt } = await establishmentSignsApplication(
      appAndDeps,
      establishmentSignJwt,
      initialImmersionApplication,
    );

    await validatorValidatesApplicationWhichTriggersConventionToBeSent(
      appAndDeps,
      validatorReviewJwt,
      initialImmersionApplication,
    );

    // REVIEW : RAJOUTER EXPECT A FAIRE !!!
  });

  const expectSentEmails = (
    emailGateway: InMemoryEmailGateway,
    emails: Partial<TemplatedEmail>[],
  ) => {
    expect(emailGateway.getSentEmails()).toMatchObject(emails);
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

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  immersionApplication: ImmersionApplicationDto,
) => {
  await request
    .post(`/${immersionApplicationsRoute}`)
    .send(immersionApplication)
    .expect(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.immersionApplication.getAll(),
    immersionApplication,
  );

  await eventCrawler.processEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(3);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    [VALID_EMAILS[0]],
    [VALID_EMAILS[1]],
    [adminEmail],
  ]);

  const beneficiarySignEmail = sentEmails[0];
  const establishmentSignEmail = sentEmails[1];

  const beneficiarySignJwt = getJwtFromMagicLink(
    beneficiarySignEmail.params.magicLink,
  );
  const establishmentSignJwt = getJwtFromMagicLink(
    establishmentSignEmail.params.magicLink,
  );

  return {
    beneficiarySignJwt,
    establishmentSignJwt,
  };
};

const beneficiarySignsApplication = async (
  { request, reposAndGateways }: TestAppAndDeps,
  beneficiarySignJwt: string,
  initialImmersionApplication: ImmersionApplicationDto,
) => {
  const response = await request.post(
    `/auth/${signApplicationRoute}/${beneficiarySignJwt}`,
  );

  expect(response.status).toBe(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.immersionApplication.getAll(),
    {
      ...initialImmersionApplication,
      status: "PARTIALLY_SIGNED",
      beneficiaryAccepted: true,
      enterpriseAccepted: false,
    },
  );
};

const establishmentSignsApplication = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  establishmentSignJwt: string,
  initialImmersionApplication: ImmersionApplicationDto,
) => {
  await request
    .post(`/auth/${signApplicationRoute}/${establishmentSignJwt}`)
    .expect(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.immersionApplication.getAll(),
    {
      ...initialImmersionApplication,
      status: "IN_REVIEW",
      beneficiaryAccepted: true,
      enterpriseAccepted: true,
    },
  );

  await eventCrawler.processEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(4);
  const needsReviewEmail = sentEmails[sentEmails.length - 1];
  expect(needsReviewEmail.recipients).toEqual([validatorEmail]);
  return {
    validatorReviewJwt: getJwtFromMagicLink(needsReviewEmail.params.magicLink),
  };
};

const validatorValidatesApplicationWhichTriggersConventionToBeSent = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  validatorReviewJwt: string,
  initialImmersionApplication: ImmersionApplicationDto,
) => {
  const params: UpdateImmersionApplicationStatusRequestDto = {
    status: "ACCEPTED_BY_VALIDATOR",
  };
  await request
    .post(`/auth/${updateApplicationStatusRoute}/${validatorReviewJwt}`)
    .send(params)
    .expect(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.immersionApplication.getAll(),
    {
      ...initialImmersionApplication,
      status: "ACCEPTED_BY_VALIDATOR",
      beneficiaryAccepted: true,
      enterpriseAccepted: true,
      rejectionJustification: undefined,
    },
  );

  await eventCrawler.processEvents();
  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(5);
  const needsToTriggerConventionSentEmail = sentEmails[sentEmails.length - 1];
  expectTypeToMatchAndEqual(
    needsToTriggerConventionSentEmail.type,
    "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
  );
  expect(needsToTriggerConventionSentEmail.recipients).toEqual([
    "beneficiary@email.fr",
    "establishment@example.com",
    validatorEmail,
  ]);
};

const expectOnlyOneImmersionThatIsEqual = (
  actualEntities: ImmersionApplicationEntity[],
  expectedDto: ImmersionApplicationDto,
) => {
  expect(actualEntities).toHaveLength(1);
  expectTypeToMatchAndEqual(actualEntities[0].toDto(), expectedDto);
};

const getJwtFromMagicLink = (link: string | unknown) => {
  expect(typeof link).toBe("string");
  const split = (link as string).split("jwt=");
  const last = split[split.length - 1];
  expect(last).toBeTruthy();
  return last;
};
