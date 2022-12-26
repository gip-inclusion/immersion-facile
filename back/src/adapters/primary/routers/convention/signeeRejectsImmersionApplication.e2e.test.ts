import {
  ConventionDtoBuilder,
  ConventionDtoWithoutExternalId,
  conventionsRoute,
  ConventionStatus,
  expectEmailOfType,
  expectJwtInMagicLinkAndGetIt,
  expectObjectsToMatch,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRoute,
} from "shared";
import {
  buildTestApp,
  TestAppAndDeps,
} from "../../../../_testBuilders/buildTestApp";

import { InMemoryConventionRepository } from "../../../secondary/InMemoryConventionRepository";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid applications in the repository, and ask for establishment edition", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    const { externalId, ...createConventionParams } = validConvention;
    const appAndDeps = await buildTestApp();

    appAndDeps.gateways.timeGateway.setNextDate(new Date());

    const { tutorJwt } = await beneficiarySubmitsApplicationForTheFirstTime(
      appAndDeps,
      createConventionParams,
    );

    await expectEstablishmentRequiresChanges(
      appAndDeps,
      tutorJwt,
      validConvention.id,
      {
        justification: "change something which is wrong",
        status: "DRAFT",
      },
    );
    // could test edition and sign but it is similar to addImmersionApplicationAndSendMails e2e tests
  });
});

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  createConventionParams: ConventionDtoWithoutExternalId,
) => {
  await request
    .post(`/${conventionsRoute}`)
    .send(createConventionParams)
    .expect(200);

  await expectStoreImmersionToHaveStatus(
    inMemoryUow.conventionRepository,
    "READY_TO_SIGN",
  );

  await eventCrawler.processNewEvents();

  const sentEmails = gateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(3);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    [createConventionParams.signatories.beneficiary.email],
    [createConventionParams.signatories.establishmentRepresentative.email],
    ["validator@mail.com"],
  ]);

  const beneficiarySignEmail = expectEmailOfType(
    sentEmails[0],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );
  const establishmentSignEmail = expectEmailOfType(
    sentEmails[1],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );

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
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  establishmentJwt: string,
  immersionApplicationId: string,
  params: UpdateConventionStatusRequestDto,
) => {
  await request
    .post(`/auth/${updateConventionStatusRoute}/${immersionApplicationId}`)
    .set("Authorization", establishmentJwt)
    .send(params);

  await eventCrawler.processNewEvents();

  // Expect two emails sent (to beneficiary and to establishment tutor)
  const sentEmails = gateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(5);
  expect(sentEmails.slice(3, 5).map((e) => e.recipients)).toEqual([
    ["beneficiary@email.fr"],
    ["establishment@example.com"],
  ]);

  expectStoreImmersionToHaveStatus(inMemoryUow.conventionRepository, "DRAFT");

  const beneficiaryEditEmail = expectEmailOfType(
    sentEmails[3],
    "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
  );
  const establishmentEditEmail = expectEmailOfType(
    sentEmails[4],
    "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
  );

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

const expectStoreImmersionToHaveStatus = (
  conventionRepo: InMemoryConventionRepository,
  expectedStatus: ConventionStatus,
) => {
  const savedConvention = conventionRepo.conventions;
  expect(savedConvention).toHaveLength(1);
  expectObjectsToMatch(savedConvention[0], {
    status: expectedStatus,
  });
};
