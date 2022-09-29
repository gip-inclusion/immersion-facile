import { ConventionDto, ConventionDtoBuilder, frontRoutes } from "shared";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";

describe("NotifyPoleEmploiUserAdvisorOnConventionFullySigned", () => {
  let emailGateway: InMemoryEmailGateway;
  let conventionPoleEmploiAdvisorRepository: InMemoryConventionPoleEmploiAdvisorRepository;
  let notifyPoleEmploiUserAdvisorOnConventionFullySigned: NotifyPoleEmploiUserAdvisorOnConventionFullySigned;
  let conventionRepository: InMemoryConventionRepository;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepository =
      uow.conventionPoleEmploiAdvisorRepository;
    conventionRepository = uow.conventionRepository;

    const uowPerformer = new InMemoryUowPerformer(uow);

    notifyPoleEmploiUserAdvisorOnConventionFullySigned =
      new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
        uowPerformer,
        emailGateway,
        fakeGenerateMagicLinkUrlFn,
      );
  });

  it("should resolve to undefined if the convention pole emploi user advisor is not found", async () => {
    const conventionDtoFromEvent: ConventionDto = new ConventionDtoBuilder()
      .withId("some-invalid-id")
      .withFederatedIdentity("peConnect:blop")
      .build();

    expect(
      await notifyPoleEmploiUserAdvisorOnConventionFullySigned.execute(
        conventionDtoFromEvent,
      ),
    ).toBeUndefined();
  });

  it("should send email with the correct params", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBeneficiaryEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    conventionRepository.setConventions({
      [conventionDtoFromEvent.id]: conventionDtoFromEvent,
    });

    const conventionPoleEmploiAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      ...userAdvisorDto,
      _entityName: "ConventionPoleEmploiAdvisor",
      conventionId,
      userPeExternalId,
    };

    conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiAdvisor,
    );

    await notifyPoleEmploiUserAdvisorOnConventionFullySigned.execute(
      conventionDtoFromEvent,
    );

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams = {
      advisorFirstName: conventionPoleEmploiAdvisor.firstName,
      advisorLastName: conventionPoleEmploiAdvisor.lastName,
      immersionAddress: conventionDtoFromEvent.immersionAddress!,
      beneficiaryFirstName:
        conventionDtoFromEvent.signatories.beneficiary.firstName,
      beneficiaryLastName:
        conventionDtoFromEvent.signatories.beneficiary.lastName,
      beneficiaryEmail: conventionDtoFromEvent.signatories.beneficiary.email,
      dateStart: conventionDtoFromEvent.dateStart,
      dateEnd: conventionDtoFromEvent.dateEnd,
      businessName: conventionDtoFromEvent.businessName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [conventionPoleEmploiAdvisor.email],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: conventionDtoFromEvent.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: conventionPoleEmploiAdvisor.email,
          }),
        },
      },
    ]);
  });
});

const conventionId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userAdvisorDto: PoleEmploiUserAdvisorDto = {
  email: "elsa.oldenburg@pole-emploi.net",
  firstName: "Elsa",
  lastName: "Oldenburg",
  userPeExternalId: "",
  type: "CAPEMPLOI",
};
