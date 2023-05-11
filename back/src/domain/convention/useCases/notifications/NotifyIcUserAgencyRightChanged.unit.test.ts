import {
  AgencyDtoBuilder,
  expectPromiseToFailWith,
  expectToEqual,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { NotifyIcUserAgencyRightChanged } from "./NotifyIcUserAgencyRightChanged";

const icUserRoleParams: IcUserRoleForAgencyParams = {
  role: "counsellor",
  agencyId: "agency-1",
  userId: "jbab-123",
};

const icUserRoleParamsWithInReviewRole: IcUserRoleForAgencyParams = {
  role: "toReview",
  agencyId: "agency-1",
  userId: "jbab-123",
};

describe("SendEmailWhenAgencyIsActivated", () => {
  let emailGateway: InMemoryEmailGateway;
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let notifyIcUserAgencyRightChanged: NotifyIcUserAgencyRightChanged;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    notifyIcUserAgencyRightChanged = new NotifyIcUserAgencyRightChanged(
      uowPerformer,
      emailGateway,
    );
  });
  it("throw error when no agency found", async () => {
    await expectPromiseToFailWith(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      `Unable to send mail. No agency config found for ${icUserRoleParams.agencyId}`,
    );

    expectToEqual(emailGateway.getSentEmails(), []);
  });

  it("throw error when no user found", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges ")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    await expectPromiseToFailWith(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      `User with id ${icUserRoleParams.userId} not found`,
    );

    expectToEqual(emailGateway.getSentEmails(), []);
  });

  it("Sends an email to validators with agency name", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const icUser: InclusionConnectedUser = {
      email: "fake-user@inclusion-connect.fr",
      firstName: "jean",
      lastName: "babouche",
      id: "jbab-123",
      dashboardUrl: "https://placeholder.com/",
      agencyRights: [
        {
          role: "toReview",
          agency,
        },
      ],
    };
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightChanged.execute(icUserRoleParams);

    const sentEmails = emailGateway.getSentEmails();
    expectToEqual(sentEmails, [
      {
        type: "IC_USER_RIGHTS_HAS_CHANGED",
        params: { agencyName: agency.name },
        recipients: [icUser.email],
      },
    ]);
  });
  it("Should not sends an email to validators with agency name when the new role is: to review", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const icUser: InclusionConnectedUser = {
      email: "fake-user@inclusion-connect.fr",
      firstName: "jean",
      lastName: "babouche",
      id: "jbab-123",
      dashboardUrl: "https://placeholder.com/",
      agencyRights: [
        {
          role: "validator",
          agency,
        },
      ],
    };
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightChanged.execute(
      icUserRoleParamsWithInReviewRole,
    );

    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });
});
