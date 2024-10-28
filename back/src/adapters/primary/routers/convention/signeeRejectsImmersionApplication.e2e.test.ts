import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionStatus,
  InclusionConnectedUserBuilder,
  UpdateConventionStatusRequestDto,
  conventionMagicLinkRoutes,
  expectEmailOfType,
  expectJwtInMagicLinkAndGetIt,
  expectObjectsToMatch,
  expectToEqual,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { InMemoryConventionRepository } from "../../../../domains/convention/adapters/InMemoryConventionRepository";
import { UserOnRepository } from "../../../../domains/core/authentication/inclusion-connect/port/UserRepository";
import { toAgencyWithRights } from "../../../../utils/agency";
import { TestAppAndDeps, buildTestApp } from "../../../../utils/buildTestApp";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid conventions in the repository, and ask for establishment edition", async () => {
    const agency = new AgencyDtoBuilder().build();
    const validConvention = new ConventionDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .withAgencyId(agency.id)
      .build();
    const validator = new InclusionConnectedUserBuilder()
      .withEmail("validator@mail.com")
      .withId("validator")
      .buildUser();

    const appAndDeps = await buildTestApp();

    appAndDeps.inMemoryUow.userRepository.users = [validator];
    appAndDeps.inMemoryUow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    appAndDeps.gateways.timeGateway.defaultDate = new Date();
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
        validator,
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
  validator: UserOnRepository,
) => {
  await request
    .post(unauthenticatedConventionRoutes.createConvention.url)
    .send({ convention })
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
      [validator.email],
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

  const httpClient = createSupertestSharedClient(technicalRoutes, request);

  const beneficiarySignLink = await shortLinkRedirectToLinkWithValidation(
    beneficiarySignEmail.params.conventionSignShortlink,
    httpClient,
  );

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentSignEmail.params.conventionSignShortlink,
    httpClient,
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
      conventionMagicLinkRoutes.updateConventionStatus.url.replace(
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

  const httpClient = createSupertestSharedClient(technicalRoutes, request);

  const establishmentSignLink = await shortLinkRedirectToLinkWithValidation(
    establishmentEditEmail.params.magicLink,
    httpClient,
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
