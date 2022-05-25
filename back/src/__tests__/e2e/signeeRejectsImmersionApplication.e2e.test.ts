import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import {
  expectObjectsToMatch,
  expectJwtInMagicLinkAndGetIt,
} from "../../_testBuilders/test.helpers";
import {
  ConventionStatus,
  ConventionDto,
  UpdateConventionStatusRequestDto,
} from "shared/src/convention/convention.dto";
import {
  conventionsRoute,
  updateConventionStatusRoute,
} from "shared/src/routes";
import { ConventionQueries } from "../../domain/convention/ports/ConventionQueries";

const adminEmail = "admin@email.fr";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid applications in the repository, and ask for establishment edition", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    const appAndDeps = await buildTestApp();

    const { tutorJwt } = await beneficiarySubmitsApplicationForTheFirstTime(
      appAndDeps,
      validConvention,
    );

    await expectEstablishmentRequiresChanges(
      appAndDeps,
      tutorJwt,
      validImmersionApplication.id,
      {
        justification: "change something which is wrong",
        status: "DRAFT",
      },
    );
    // could test edition and sign but it is similar to addImmersionApplicationAndSendMails e2e tests
  });
});

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  convention: ConventionDto,
) => {
  await request.post(`/${conventionsRoute}`).send(convention).expect(200);

  await expectStoreImmersionToHaveStatus(
    reposAndGateways.conventionQueries,
    "READY_TO_SIGN",
  );

  await eventCrawler.processNewEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(3);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    [convention.email],
    [convention.mentorEmail],
    [adminEmail],
  ]);

  const beneficiarySignEmail = sentEmails[0];
  const establishmentSignEmail = sentEmails[1];

  const beneficiaryJwt = expectJwtInMagicLinkAndGetIt(
    beneficiarySignEmail.params.magicLink,
  );
  const tutorJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignEmail.params.magicLink,
  );

  return {
    beneficiaryJwt,
    tutorJwt,
  };
};

const expectEstablishmentRequiresChanges = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  establishmentJwt: string,
  immersionApplicationId: string,
  { status, justification }: UpdateConventionStatusRequestDto,
) => {
  await request
    .post(`/auth/${updateConventionStatusRoute}/${immersionApplicationId}`)
    .set("Authorization", establishmentJwt)
    .send({ status, justification });

  await eventCrawler.processNewEvents();

  // Expect two emails sent (to beneficiary and to mentor)
  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(5);
  expect(sentEmails.slice(3, 5).map((e) => e.recipients)).toEqual([
    ["beneficiary@email.fr"],
    ["establishment@example.com"],
  ]);

  await expectStoreImmersionToHaveStatus(
    reposAndGateways.conventionQueries,
    "DRAFT",
  );

  const beneficiaryEditEmail = sentEmails[3];
  const establishmentEditEmail = sentEmails[4];

  const beneficiaryEditJwt = expectJwtInMagicLinkAndGetIt(
    beneficiaryEditEmail.params.magicLink,
  );
  const establishmentEditJwt = expectJwtInMagicLinkAndGetIt(
    establishmentEditEmail.params.magicLink,
  );

  return {
    beneficiaryEditJwt,
    establishmentEditJwt,
  };
};

const expectStoreImmersionToHaveStatus = async (
  applicationQueries: ConventionQueries,
  expectedStatus: ConventionStatus,
) => {
  const savedConvention = await applicationQueries.getLatestUpdated();
  expect(savedConvention).toHaveLength(1);
  expectObjectsToMatch(savedConvention[0], {
    status: expectedStatus,
  });
};
