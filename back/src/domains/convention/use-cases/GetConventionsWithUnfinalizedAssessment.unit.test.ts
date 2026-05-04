import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  expectToEqual,
  maxPerPageInWebPagination,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetConventionsWithUnfinalizedAssessment } from "./GetConventionsWithUnfinalizedAssessment";

describe("GetConventionsWithUnfinalizedAssessment", () => {
  const now = new Date("2026-06-15T10:00:00Z");
  const agencyUserId = "agency-user-id-12345";

  const agencyWithRole = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
      .withName("Test Agency")
      .withKind("pole-emploi")
      .build(),
    {
      [agencyUserId]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const agencyWithoutRole = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
      .withName("Other Agency")
      .withKind("pole-emploi")
      .build(),
    {
      [agencyUserId]: { isNotifiedByEmail: true, roles: [] },
    },
  );

  let uow: InMemoryUnitOfWork;
  let useCase: ReturnType<typeof makeGetConventionsWithUnfinalizedAssessment>;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);
    const uowPerformer = new InMemoryUowPerformer(uow);
    useCase = makeGetConventionsWithUnfinalizedAssessment({
      uowPerformer,
      deps: { timeGateway },
    });
  });

  it("passes only agency ids from rights that have at least one role", async () => {
    const currentUser = new ConnectedUserBuilder()
      .withId(agencyUserId)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRole, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithoutRole, []),
          roles: [],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    const calls =
      uow.conventionQueries
        .getConventionsWithUnfinalizedAssessmentForAgencyUserParams;
    expectToEqual(calls, [
      {
        userAgencyIds: [agencyWithRole.id],
        pagination: { page: 1, perPage: 10 },
        now,
      },
    ]);
  });

  it("passes an empty agency id list when every right has no roles", async () => {
    const currentUser = new ConnectedUserBuilder()
      .withId(agencyUserId)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithoutRole, []),
          roles: [],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    const calls =
      uow.conventionQueries
        .getConventionsWithUnfinalizedAssessmentForAgencyUserParams;
    expectToEqual(calls, [
      {
        userAgencyIds: [],
        pagination: { page: 1, perPage: 10 },
        now,
      },
    ]);
  });

  it("passes timeGateway.now() as now", async () => {
    const currentUser = new ConnectedUserBuilder()
      .withId(agencyUserId)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRole, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    const calls =
      uow.conventionQueries
        .getConventionsWithUnfinalizedAssessmentForAgencyUserParams;
    expectToEqual(calls, [
      {
        userAgencyIds: [agencyWithRole.id],
        pagination: { page: 1, perPage: 10 },
        now,
      },
    ]);
  });

  it("passes pagination produced by getPaginationParamsForWeb", async () => {
    const currentUser = new ConnectedUserBuilder()
      .withId(agencyUserId)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRole, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await useCase.execute({ page: 2, perPage: 15 }, currentUser);

    const calls =
      uow.conventionQueries
        .getConventionsWithUnfinalizedAssessmentForAgencyUserParams;
    expectToEqual(calls, [
      {
        userAgencyIds: [agencyWithRole.id],
        pagination: { page: 2, perPage: 15 },
        now,
      },
    ]);
  });

  it("caps perPage to maxPerPageInWebPagination", async () => {
    const currentUser = new ConnectedUserBuilder()
      .withId(agencyUserId)
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRole, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await useCase.execute({ page: 1, perPage: 500 }, currentUser);

    const calls =
      uow.conventionQueries
        .getConventionsWithUnfinalizedAssessmentForAgencyUserParams;
    expectToEqual(calls, [
      {
        userAgencyIds: [agencyWithRole.id],
        pagination: { page: 1, perPage: maxPerPageInWebPagination },
        now,
      },
    ]);
  });
});
