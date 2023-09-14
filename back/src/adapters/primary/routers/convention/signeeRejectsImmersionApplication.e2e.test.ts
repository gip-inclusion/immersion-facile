import {
  ConventionDto,
  ConventionDtoBuilder,
  conventionMagicLinkTargets,
  ConventionStatus,
  expectEmailOfType,
  expectJwtInMagicLinkAndGetIt,
  expectObjectsToMatch,
  expectToEqual,
  unauthenticatedConventionTargets,
  UpdateConventionStatusRequestDto,
} from "shared";
import {
  buildTestApp,
  TestAppAndDeps,
} from "../../../../_testBuilders/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { InMemoryConventionRepository } from "../../../secondary/InMemoryConventionRepository";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid applications in the repository, and ask for establishment edition", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();

    const appAndDeps = await buildTestApp();

    appAndDeps.gateways.timeGateway.setNextDate(new Date());
    appAndDeps.gateways.shortLinkGenerator.addMoreShortLinkIds([
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
      "shortLink5",
      "shortLink6",
      "shortLink7",
      "shortLink8",
      "shortLink9",
      "shortLink10",
    ]);

    const { establishmentRepJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        validConvention,
      );

    await expectEstablishmentRequiresChanges(appAndDeps, establishmentRepJwt, {
      statusJustification: "change something which is wrong",
      status: "DRAFT",
      conventionId: validConvention.id,
      modifierRole: "establishment-representative",
    });
    // could test edition and sign but it is similar to addImmersionApplicationAndSendMails e2e tests
  });
});

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, gateways, eventCrawler, inMemoryUow }: TestAppAndDeps,
  convention: ConventionDto,
) => {
  await request
    .post(unauthenticatedConventionTargets.createConvention.url)
    .send(convention)
    .expect(200);

  await expectStoreImmersionToHaveStatus(
    inMemoryUow.conventionRepository,
    "READY_TO_SIGN",
  );

  //Need to process events 2 times in order to handle submit & associate events
  await eventCrawler.processNewEvents();
  await processEventsForEmailToBeSent(eventCrawler);

  const sentEmails = gateways.notification.getSentEmails();

  expectToEqual(
    sentEmails.map((e) => e.recipients),
    [
      ["validator@mail.com"],
      [convention.signatories.beneficiary.email],
      [convention.signatories.establishmentRepresentative.email],
    ],
  );

  const beneficiarySignEmail = expectEmailOfType(
    sentEmails[1],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );
  const establishmentSignEmail = expectEmailOfType(
    sentEmails[2],
    "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  );

  const beneficiarySignLink = await shortLinkRedirectToLinkWithValidation(
    beneficiarySignEmail.params.conventionSignShortlink,
    request,
  );

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentSignEmail.params.conventionSignShortlink,
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
  params: UpdateConventionStatusRequestDto,
) => {
  await request
    .post(
      conventionMagicLinkTargets.updateConventionStatus.url.replace(
        ":conventionId",
        params.conventionId,
      ),
    )
    .set("Authorization", establishmentJwt)
    .send(params);

  await processEventsForEmailToBeSent(eventCrawler);

  // Expect one email sent ( to establishment representative)
  const sentEmails = gateways.notification.getSentEmails();
  expect(sentEmails).toHaveLength(4);
  expect(sentEmails.slice(3).map((e) => e.recipients)).toEqual([
    ["establishment@example.com"],
  ]);

  expectStoreImmersionToHaveStatus(inMemoryUow.conventionRepository, "DRAFT");

  const establishmentEditEmail = expectEmailOfType(
    sentEmails[3],
    "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
  );

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentEditEmail.params.magicLink,
    request,
  );

  const establishmentEditJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignLink,
  );

  return {
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
