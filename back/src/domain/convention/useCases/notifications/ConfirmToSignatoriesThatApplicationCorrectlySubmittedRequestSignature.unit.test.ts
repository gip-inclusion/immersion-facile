import {
  AgencyDto,
  ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { expectEmailSignatoryConfirmationSignatureRequestMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryShortLinkQuery } from "../../../../adapters/secondary/InMemoryShortLinkQuery";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { ShortLinkId } from "../../../core/ports/ShortLinkQuery";
import { ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature } from "./ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature";

describe("Add Convention Notifications", () => {
  let useCase: ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature;
  let emailGw: InMemoryEmailGateway;
  let timeGateway: CustomTimeGateway;
  let validConvention: ConventionDto;
  let agency: AgencyDto;
  let shortLinkQuery: InMemoryShortLinkQuery;
  let config: AppConfig;
  let shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    emailGw = new InMemoryEmailGateway();
    timeGateway = new CustomTimeGateway(new Date());
    const uow = createInMemoryUow();
    agency = uow.agencyRepository.agencies[0];
    shortLinkQuery = uow.shortLinkQuery;
    validConvention = new ConventionDtoBuilder()
      .withBeneficiaryRepresentative({
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
      })
      .withAgencyId(agency.id)
      .build();
    shortLinkGenerator = new DeterministShortLinkIdGeneratorGateway();
    useCase =
      new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
        new InMemoryUowPerformer(uow),
        emailGw,
        timeGateway,
        shortLinkGenerator,
        fakeGenerateMagicLinkUrlFn,
        config,
      );
  });

  it("Sends confirmation email to all signatories", async () => {
    const deterministicShortLinks: ShortLinkId[] = [
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
      "shortLink5",
      "shortLink6",
    ];
    shortLinkGenerator.addMoreShortLinkIds(deterministicShortLinks);

    await useCase.execute(validConvention);

    expectToEqual(shortLinkQuery.getShortLinks(), {
      [deterministicShortLinks[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiary.role,
        email: validConvention.signatories.beneficiary.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiary.role,
        email: validConvention.signatories.beneficiary.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
      [deterministicShortLinks[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.establishmentRepresentative!.role,
        email: validConvention.signatories.establishmentRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.establishmentRepresentative!.role,
        email: validConvention.signatories.establishmentRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
      [deterministicShortLinks[4]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiaryRepresentative!.role,
        email: validConvention.signatories.beneficiaryRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[5]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiaryRepresentative!.role,
        email: validConvention.signatories.beneficiaryRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
    });

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(3);

    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[0],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiary,
      recipient: validConvention.signatories.beneficiary.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[0],
      conventionStatusLinkId: deterministicShortLinks[1],
    });
    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[1],
      convention: validConvention,
      signatory: validConvention.signatories.establishmentRepresentative,
      recipient: validConvention.signatories.establishmentRepresentative.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[2],
      conventionStatusLinkId: deterministicShortLinks[3],
    });
    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[2],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiaryRepresentative!,
      recipient: validConvention.signatories.beneficiaryRepresentative!.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[4],
      conventionStatusLinkId: deterministicShortLinks[5],
    });
  });
});
