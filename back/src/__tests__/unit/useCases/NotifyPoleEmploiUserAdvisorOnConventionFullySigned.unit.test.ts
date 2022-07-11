import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { frontRoutes } from "shared/src/routes";
import { OmitFromExistingKeys } from "shared/src/utils";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { AlwaysAllowEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { PoleEmploiAdvisorOnConventionFullysignedParams } from "../../../domain/convention/ports/EmailGateway";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";

describe("NotifyPoleEmploiUserAdvisorOnConventionFullySigned", () => {
  let emailGateway: InMemoryEmailGateway;
  let conventionPoleEmploiAdvisorRepository: InMemoryConventionPoleEmploiAdvisorRepository;
  let notifyPoleEmploiUserAdvisorOnConventionFullySigned: NotifyPoleEmploiUserAdvisorOnConventionFullySigned;
  let conventionRepository: InMemoryConventionRepository;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    const emailFilter = new AlwaysAllowEmailFilter();
    conventionPoleEmploiAdvisorRepository =
      new InMemoryConventionPoleEmploiAdvisorRepository();
    conventionRepository = new InMemoryConventionRepository();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      conventionPoleEmploiAdvisorRepo: conventionPoleEmploiAdvisorRepository,
      conventionRepository,
    });

    notifyPoleEmploiUserAdvisorOnConventionFullySigned =
      new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
        uowPerformer,
        emailFilter,
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
      .withFirstName("John")
      .withLastName("Doe")
      .withEmail("john.doe@plop.fr")
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

    const expectedParams: OmitFromExistingKeys<
      PoleEmploiAdvisorOnConventionFullysignedParams,
      "magicLink"
    > = {
      advisorFirstName: conventionPoleEmploiAdvisor.firstName,
      advisorLastName: conventionPoleEmploiAdvisor.lastName,
      immersionAddress: conventionDtoFromEvent.immersionAddress!,
      beneficiaryFirstName: conventionDtoFromEvent.firstName,
      beneficiaryLastName: conventionDtoFromEvent.lastName,
      beneficiaryEmail: conventionDtoFromEvent.email,
      dateStart: conventionDtoFromEvent.dateStart,
      dateEnd: conventionDtoFromEvent.dateEnd,
      businessName: conventionDtoFromEvent.businessName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [conventionPoleEmploiAdvisor.email],
        cc: [],
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
