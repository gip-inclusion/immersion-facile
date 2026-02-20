import {
  AgencyDtoBuilder,
  type BroadcastFeedback,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import type { SearchTextAlphaNumeric } from "shared/src/search/searchText.schema";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type GetConventionsWithErroredBroadcastFeedback,
  makeGetConventionsWithErroredBroadcastFeedback,
} from "./GetConventionsWithErroredBroadcastFeedback";

describe("GetConventionsWithErroredBroadcastFeedback", () => {
  const agencyId1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const userId1 = "user-id-1";
  const agency1 = toAgencyWithRights(
    new AgencyDtoBuilder().withId(agencyId1).withKind("pole-emploi").build(),
    {
      [userId1]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const user1 = new ConnectedUserBuilder()
    .withId(userId1)
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    ])
    .build();

  const convention1 = new ConventionDtoBuilder()
    .withId("convention-id-1")
    .withAgencyId(agencyId1)
    .build();

  const convention2 = new ConventionDtoBuilder()
    .withId("convention-id-2")
    .withAgencyId(agencyId1)
    .build();

  const managedErrorFeedback: BroadcastFeedback = {
    serviceName: "test-service",
    consumerId: "consumer-id-1",
    consumerName: "Test Consumer",
    subscriberErrorFeedback: {
      message: "Aucun dossier trouvé pour les critères d'identité transmis",
    },
    requestParams: {
      conventionId: convention1.id,
    },
    occurredAt: "2024-01-16T10:00:00.000Z",
    handledByAgency: false,
  };

  const unmanagedErrorFeedback: BroadcastFeedback = {
    serviceName: "test-service",
    consumerId: "consumer-id-2",
    consumerName: "Test Consumer",
    subscriberErrorFeedback: {
      message: "Some unmanaged error message",
    },
    requestParams: {
      conventionId: convention2.id,
    },
    occurredAt: "2024-01-16T11:00:00.000Z",
    handledByAgency: false,
  };

  let uow: InMemoryUnitOfWork;
  let useCase: GetConventionsWithErroredBroadcastFeedback;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = makeGetConventionsWithErroredBroadcastFeedback({
      uowPerformer: new InMemoryUowPerformer(uow),
    });

    uow.agencyRepository.agencies = [agency1];
    uow.conventionRepository.setConventions([convention1, convention2]);
    uow.broadcastFeedbacksRepository.broadcastFeedbacks = [
      managedErrorFeedback,
      unmanagedErrorFeedback,
    ];
  });

  it("should pass through filters when provided", async () => {
    const result = await useCase.execute(
      {
        pagination: { page: 1, perPage: 10 },
        filters: {
          broadcastErrorKind: "functional",
        },
      },
      user1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention1.id,
          status: convention1.status,
          beneficiary: {
            firstname: convention1.signatories.beneficiary.firstName,
            lastname: convention1.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: managedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 1,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });

  it("should return all errors when no filter is provided", async () => {
    const result = await useCase.execute(
      {
        pagination: { page: 1, perPage: 10 },
      },
      user1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention2.id,
          status: convention2.status,
          beneficiary: {
            firstname: convention2.signatories.beneficiary.firstName,
            lastname: convention2.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: unmanagedErrorFeedback,
        },
        {
          id: convention1.id,
          status: convention1.status,
          beneficiary: {
            firstname: convention1.signatories.beneficiary.firstName,
            lastname: convention1.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: managedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 2,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });

  it("should filter by technical errors when broadcastErrorKind is 'technical'", async () => {
    const result = await useCase.execute(
      {
        pagination: {
          page: 1,
          perPage: 10,
        },
        filters: {
          broadcastErrorKind: "technical",
        },
      },
      user1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention2.id,
          status: convention2.status,
          beneficiary: {
            firstname: convention2.signatories.beneficiary.firstName,
            lastname: convention2.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: unmanagedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 1,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });

  it("should only include agencies where user has roles", async () => {
    const agencyId2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const agency2 = toAgencyWithRights(
      new AgencyDtoBuilder().withId(agencyId2).withKind("pole-emploi").build(),
      {
        [userId1]: { isNotifiedByEmail: true, roles: [] },
      },
    );

    const convention3 = new ConventionDtoBuilder()
      .withId("convention-id-3")
      .withAgencyId(agencyId2)
      .build();

    const errorFeedbackForAgency2: BroadcastFeedback = {
      serviceName: "test-service",
      consumerId: "consumer-id-3",
      consumerName: "Test Consumer",
      subscriberErrorFeedback: {
        message: "Some error message",
      },
      requestParams: {
        conventionId: convention3.id,
      },
      occurredAt: "2024-01-16T12:00:00.000Z",
      handledByAgency: false,
    };

    const userWithRightOnAgency1 = new ConnectedUserBuilder()
      .withId(userId1)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    uow.agencyRepository.agencies = [agency1, agency2];
    uow.conventionRepository.setConventions([
      convention1,
      convention2,
      convention3,
    ]);
    uow.broadcastFeedbacksRepository.broadcastFeedbacks = [
      managedErrorFeedback,
      unmanagedErrorFeedback,
      errorFeedbackForAgency2,
    ];

    const result = await useCase.execute(
      {
        pagination: { page: 1, perPage: 10 },
      },
      userWithRightOnAgency1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention2.id,
          status: convention2.status,
          beneficiary: {
            firstname: convention2.signatories.beneficiary.firstName,
            lastname: convention2.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: unmanagedErrorFeedback,
        },
        {
          id: convention1.id,
          status: convention1.status,
          beneficiary: {
            firstname: convention1.signatories.beneficiary.firstName,
            lastname: convention1.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: managedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 2,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });

  it("should filter by search (convention ID)", async () => {
    const result = await useCase.execute(
      {
        pagination: { page: 1, perPage: 10 },
        filters: { search: convention1.id as SearchTextAlphaNumeric },
      },
      user1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention1.id,
          status: convention1.status,
          beneficiary: {
            firstname: convention1.signatories.beneficiary.firstName,
            lastname: convention1.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: managedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 1,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });

  it("should filter by search combined with other filters", async () => {
    const result = await useCase.execute(
      {
        pagination: { page: 1, perPage: 10 },
        filters: {
          search: convention1.id as SearchTextAlphaNumeric,
          broadcastErrorKind: "functional",
        },
      },
      user1,
    );

    expectToEqual(result, {
      data: [
        {
          id: convention1.id,
          status: convention1.status,
          beneficiary: {
            firstname: convention1.signatories.beneficiary.firstName,
            lastname: convention1.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback: managedErrorFeedback,
        },
      ],
      pagination: {
        totalRecords: 1,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    });
  });
});
