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
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { NotifyIcUserAgencyRightChanged } from "./NotifyIcUserAgencyRightChanged";

const icUserRoleParams: IcUserRoleForAgencyParams = {
  role: "counsellor",
  agencyId: "agency-1",
  userId: "jbab-123",
};

describe("SendEmailWhenAgencyIsActivated", () => {
  let notificationGateway: InMemoryNotificationGateway;
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let notifyIcUserAgencyRightChanged: NotifyIcUserAgencyRightChanged;

  beforeEach(() => {
    notificationGateway = new InMemoryNotificationGateway();
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    notifyIcUserAgencyRightChanged = new NotifyIcUserAgencyRightChanged(
      uowPerformer,
      notificationGateway,
    );
  });
  it("throw error when no agency found", async () => {
    await expectPromiseToFailWith(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      `Unable to send mail. No agency config found for ${icUserRoleParams.agencyId}`,
    );

    expectToEqual(notificationGateway.getSentEmails(), []);
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

    expectToEqual(notificationGateway.getSentEmails(), []);
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

    const sentEmails = notificationGateway.getSentEmails();
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

    await notifyIcUserAgencyRightChanged.execute({
      role: "toReview",
      agencyId: "agency-1",
      userId: "jbab-123",
    });

    const sentEmails = notificationGateway.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });
});
