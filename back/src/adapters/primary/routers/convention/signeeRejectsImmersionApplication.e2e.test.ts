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
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { InMemoryConventionRepository } from "../../../secondary/InMemoryConventionRepository";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid applications in the repository, and ask for establishment edition", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    const { externalId, ...createConventionParams } = validConvention;
    const appAndDeps = await buildTestApp();

    appAndDeps.gateways.timeGateway.setNextDate(new Date());
    appAndDeps.gateways.shortLinkGenerator.addMoreShortLinkIds([
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
    ]);

    const { establishmentRepJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        createConventionParams,
      );

    await expectEstablishmentRequiresChanges(
      appAndDeps,
      establishmentRepJwt,
      validConvention.id,
      {
        statusJustification: "change something which is wrong",
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

  //Need to process events 2 times in order to handle submit & associate events
  await eventCrawler.processNewEvents();
  await eventCrawler.processNewEvents();

  const sentEmails = gateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(3);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    ["validator@mail.com"],
    [createConventionParams.signatories.beneficiary.email],
    [createConventionParams.signatories.establishmentRepresentative.email],
  ]);

  const beneficiarySignEmail = expectEmailOfType(
    sentEmails[1],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );
  const establishmentSignEmail = expectEmailOfType(
    sentEmails[2],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );

  const beneficiarySignLink = await shortLinkRedirectToLinkWithValidation(
    beneficiarySignEmail.params.magicLink,
    request,
  );

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentSignEmail.params.magicLink,
    request,
  );

  const beneficiaryJwt = expectJwtInMagicLinkAndGetIt(beneficiarySignLink);
  const establishmentRepJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignLink,
  );

  return {
    beneficiaryJwt,
    establishmentRepJwt,
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
