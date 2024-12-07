import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { GetInclusionConnectedUsers } from "./GetInclusionConnectedUsers";

const johnBuilder = new InclusionConnectedUserBuilder()
  .withId("john-123")
  .withFirstName("John")
  .withLastName("Lennon")
  .withEmail("john@mail.com")
  .withCreatedAt(new Date())
  .withExternalId("john-external-id");

const johnUser = johnBuilder.buildUser();
const icJohn = johnBuilder.build();

const paulBuilder = new InclusionConnectedUserBuilder()
  .withId("paul-456")
  .withFirstName("Paul")
  .withLastName("McCartney")
  .withEmail("paul@mail.com")
  .withCreatedAt(new Date())
  .withExternalId("paul-external-id");

const paulUser = paulBuilder.buildUser();
const icPaul = paulBuilder.build();

const backOfficeUserBuilder = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin")
  .withFirstName("Jack")
  .withLastName("The Admin")
  .withEmail("jack.admin@mail.com")
  .withCreatedAt(new Date())
  .withExternalId("jack-admin-external-id")
  .withIsAdmin(true);

const backOfficeUser = backOfficeUserBuilder.buildUser();
const icbackOffice = backOfficeUserBuilder.build();

const agencyAdminUserBuilder = new InclusionConnectedUserBuilder()
  .withId("agency-admin")
  .withFirstName("Jack")
  .withLastName("The agency Admin")
  .withEmail("jack.admin@mail.com")
  .withCreatedAt(new Date())
  .withExternalId("jack-admin-external-id")
  .withIsAdmin(true);

const agencyAdminUser = agencyAdminUserBuilder.buildUser();
const icAgencyAdmin = agencyAdminUserBuilder.build();

const notBackOfficeUserBuilder = new InclusionConnectedUserBuilder(icbackOffice)
  .withExternalId("not-backoffice-admin")
  .withIsAdmin(false);
const notBackOfficeUser = notBackOfficeUserBuilder.buildUser();
const icNotBackOffice = notBackOfficeUserBuilder.build();

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
const agencyWithRefersTo = new AgencyDtoBuilder()
  .withId("agency-with-refers-to")
  .withRefersToAgencyInfo({
    refersToAgencyId: agency2.id,
    refersToAgencyName: agency2.name,
  })
  .build();
const {
  validatorEmails: _,
  counsellorEmails: __,
  ...agency1WithoutEmails
} = agency1;
const {
  validatorEmails: ___,
  counsellorEmails: ____,
  ...agency2WithoutEmails
} = agency2;

const {
  validatorEmails: _____,
  counsellorEmails: ______,
  ...agencyWithRefersToWithoutEmails
} = agencyWithRefersTo;

const agency1WithRights = toAgencyWithRights(agency1, {
  [johnUser.id]: {
    roles: ["to-review"],
    isNotifiedByEmail: true,
  },
  [paulUser.id]: {
    roles: ["counsellor"],
    isNotifiedByEmail: true,
  },
});

const agency2WithRights = toAgencyWithRights(agency2, {
  [johnUser.id]: {
    roles: ["validator"],
    isNotifiedByEmail: true,
  },
  [paulUser.id]: {
    roles: ["validator"],
    isNotifiedByEmail: true,
  },
});

const agencyWithRefersToWithRights = toAgencyWithRights(agencyWithRefersTo, {
  [agencyAdminUser.id]: {
    roles: ["agency-admin"],
    isNotifiedByEmail: true,
  },
});

describe("GetInclusionConnectedUsers", () => {
  let getInclusionConnectedUsers: GetInclusionConnectedUsers;

  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getInclusionConnectedUsers = new GetInclusionConnectedUsers(
      new InMemoryUowPerformer(uow),
    );
  });

  it("throws Unauthorized if no jwt token provided", async () => {
    await expectPromiseToFailWithError(
      getInclusionConnectedUsers.execute({ agencyRole: "to-review" }),
      errors.user.unauthorized(),
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    uow.userRepository.users = [notBackOfficeUser];

    await expectPromiseToFailWithError(
      getInclusionConnectedUsers.execute(
        { agencyRole: "to-review" },
        icNotBackOffice,
      ),
      errors.user.forbidden({ userId: notBackOfficeUser.id }),
    );
  });

  it("throws Forbidden if filter has agency id and token payload is not backoffice token neither agency Admin ", async () => {
    uow.userRepository.users = [icPaul];

    await expectPromiseToFailWithError(
      getInclusionConnectedUsers.execute({ agencyId: agency2.id }, icPaul),
      errors.user.forbidden({ userId: icPaul.id }),
    );
  });

  it("gets the users by agencyRole which have at least one agency with the given role", async () => {
    uow.userRepository.users = [johnUser, paulUser, backOfficeUser];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getInclusionConnectedUsers.execute(
      { agencyRole: "to-review" },
      icbackOffice,
    );

    expectToEqual(users, [
      {
        ...icJohn,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });

  it("gets the users by agencyId which have at least one agency with the given role", async () => {
    uow.userRepository.users = [johnUser, paulUser, backOfficeUser];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getInclusionConnectedUsers.execute(
      { agencyId: agency1.id },
      icbackOffice,
    );

    expectToEqual(users, [
      {
        ...icJohn,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...icPaul,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });

  it("gets the users by agencyId when agency admin request it", async () => {
    uow.userRepository.users = [
      johnUser,
      paulUser,
      backOfficeUser,
      agencyAdminUser,
    ];
    uow.agencyRepository.agencies = [
      agency1WithRights,
      agency2WithRights,
      agencyWithRefersToWithRights,
    ];

    const users = await getInclusionConnectedUsers.execute(
      { agencyId: agencyWithRefersToWithRights.id },
      icAgencyAdmin,
    );

    expectToEqual(users, [
      {
        ...icAgencyAdmin,
        agencyRights: [
          {
            agency: agencyWithRefersToWithoutEmails,
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        ],
      },
    ]);
  });

  it("returns results ordered Alphabetically, people with no name should be first", async () => {
    const genericUserBuilder = new InclusionConnectedUserBuilder()
      .withId("generic-222")
      .withFirstName("")
      .withLastName("")
      .withEmail("generic@mail.com")
      .withCreatedAt(new Date());

    const genericUser = genericUserBuilder.buildUser();
    const icGenericUser = genericUserBuilder.build();

    const agency1WithRights = toAgencyWithRights(agency1, {
      [johnUser.id]: {
        roles: ["to-review"],
        isNotifiedByEmail: true,
      },
      [paulUser.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
      [genericUser.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
    });

    const agency2WithRights = toAgencyWithRights(agency2, {
      [johnUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
      [paulUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
      [genericUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    });

    uow.userRepository.users = [
      johnUser,
      paulUser,
      backOfficeUser,
      genericUser,
    ];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getInclusionConnectedUsers.execute(
      { agencyId: agency1.id },
      icbackOffice,
    );

    expectToEqual(users, [
      {
        ...icGenericUser,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...icJohn,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...icPaul,
        agencyRights: [
          {
            agency: agency1WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: agency2WithoutEmails,
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });
});
