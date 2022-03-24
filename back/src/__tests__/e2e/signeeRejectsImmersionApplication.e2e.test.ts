import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import {
  expectObjectsToMatch,
  expectJwtInMagicLinkAndGetIt,
} from "../../_testBuilders/test.helpers";
import { ImmersionApplicationRepository } from "../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  UpdateImmersionApplicationStatusRequestDto,
} from "../../shared/ImmersionApplication/ImmersionApplication.dto";
import {
  immersionApplicationsRoute,
  updateApplicationStatusRoute,
} from "../../shared/routes";

const adminEmail = "admin@email.fr";

describe("Add immersionApplication Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid applications in the repository, and ask for establishment edition", async () => {
    const validImmersionApplication = new ImmersionApplicationDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    const appAndDeps = await buildTestApp();

    const { establishmentJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        validImmersionApplication,
      );

    await expectEstablishmentRequiresChanges(appAndDeps, establishmentJwt, {
      justification: "change something which is wrong",
      status: "DRAFT",
    });
    // could test edition and sign but it is similar to addImmersionApplicationAndSendMails e2e tests
  });
});

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  immersionApplication: ImmersionApplicationDto,
) => {
  await request
    .post(`/${immersionApplicationsRoute}`)
    .send(immersionApplication)
    .expect(200);

  await expectStoreImmersionToHaveStatus(
    reposAndGateways.immersionApplication,
    "READY_TO_SIGN",
  );

  await eventCrawler.processNewEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(3);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    [immersionApplication.email],
    [immersionApplication.mentorEmail],
    [adminEmail],
  ]);

  const beneficiarySignEmail = sentEmails[0];
  const establishmentSignEmail = sentEmails[1];

  const beneficiaryJwt = expectJwtInMagicLinkAndGetIt(
    beneficiarySignEmail.params.magicLink,
  );
  const establishmentJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignEmail.params.magicLink,
  );

  return {
    beneficiaryJwt,
    establishmentJwt,
  };
};

const expectEstablishmentRequiresChanges = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  establishmentJwt: string,
  { status, justification }: UpdateImmersionApplicationStatusRequestDto,
) => {
  await request
    .post(`/auth/${updateApplicationStatusRoute}/${establishmentJwt}`)
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
    reposAndGateways.immersionApplication,
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
  applicationRepo: ImmersionApplicationRepository,
  expectedStatus: ApplicationStatus,
) => {
  const savedImmersionApplications = await applicationRepo.getAll();
  expect(savedImmersionApplications).toHaveLength(1);
  expectObjectsToMatch(savedImmersionApplications[0].toDto(), {
    status: expectedStatus,
  });
};
