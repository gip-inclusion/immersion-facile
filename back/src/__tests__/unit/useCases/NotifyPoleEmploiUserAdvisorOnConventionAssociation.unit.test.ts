import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { frontRoutes } from "shared/src/routes";
import {
  expectPromiseToFailWithError,
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { NotifyPoleEmploiUserAdvisorOnConventionAssociation } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionAssociation";

describe("NotifyPoleEmploiUserAdvisorOnConventionAssociation", () => {
  let emailGateway: InMemoryEmailGateway;
  let conventionPoleEmploiAdvisorRepository: InMemoryConventionPoleEmploiAdvisorRepository;
  let conventionRepository: InMemoryConventionRepository;
  let notifyPoleEmploiUserAdvisorOnAssociation: NotifyPoleEmploiUserAdvisorOnConventionAssociation;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();

    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepository = uow.conventionPoleEmploiAdvisorRepo;
    conventionRepository = uow.conventionRepository;

    const uowPerformer = new InMemoryUowPerformer(uow);

    notifyPoleEmploiUserAdvisorOnAssociation =
      new NotifyPoleEmploiUserAdvisorOnConventionAssociation(
        uowPerformer,
        emailGateway,
        fakeGenerateMagicLinkUrlFn,
      );
  });

  it("should throw an error if the convention is not found", async () => {
    const conventionPoleEmploiAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      _entityName: "ConventionPoleEmploiAdvisor",
      conventionId,
      email: "plop@plip.fr",
      firstName: "Plop",
      lastName: "Plip",
      type: "CAPEMPLOI",
      userPeExternalId,
    };

    conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiAdvisor,
    );

    await expectPromiseToFailWithError(
      notifyPoleEmploiUserAdvisorOnAssociation.execute({
        conventionId,
        peExternalId: userPeExternalId,
      }),
      new NotFoundError(
        "There is no convention associated with this user pole emploi advisor",
      ),
    );
  });

  it("should throw an error if the convention advisor is not found", async () => {
    const conventionDto = new ConventionDtoBuilder()
      .withId(conventionId)
      .build();

    conventionRepository.setConventions({
      [conventionDto.id]: conventionDto,
    });

    await expectPromiseToFailWithError(
      notifyPoleEmploiUserAdvisorOnAssociation.execute({
        conventionId,
        peExternalId: userPeExternalId,
      }),
      new NotFoundError(
        "There is no open pole emploi advisor entity linked to this user conventionId",
      ),
    );
  });

  it("should send email with the correct params", async () => {
    const conventionDto = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFirstName("John")
      .withLastName("Doe")
      .withEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    conventionRepository.setConventions({
      [conventionDto.id]: conventionDto,
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

    await notifyPoleEmploiUserAdvisorOnAssociation.execute({
      conventionId,
      peExternalId: userPeExternalId,
    });

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams = {
      advisorFirstName: conventionPoleEmploiAdvisor.firstName,
      advisorLastName: conventionPoleEmploiAdvisor.lastName,
      immersionAddress: conventionDto.immersionAddress!,
      beneficiaryFirstName: conventionDto.firstName,
      beneficiaryLastName: conventionDto.lastName,
      beneficiaryEmail: conventionDto.email,
      dateStart: conventionDto.dateStart,
      dateEnd: conventionDto.dateEnd,
      businessName: conventionDto.businessName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
        recipients: [conventionPoleEmploiAdvisor.email],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: conventionDto.id,
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
