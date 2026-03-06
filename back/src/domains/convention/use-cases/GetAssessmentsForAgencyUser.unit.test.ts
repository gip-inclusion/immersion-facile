import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyRole,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type GetAssessmentsForAgencyUser,
  makeGetAssessmentsForAgencyUser,
} from "./GetAssessmentsForAgencyUser";

const signedAt = new Date("2024-05-28").toISOString();
const dateValidation = new Date("2024-06-01").toISOString();

const buildAcceptedConvention = (agencyId: string, conventionId: string) =>
  new ConventionDtoBuilder()
    .withId(conventionId)
    .withAgencyId(agencyId)
    .signedByBeneficiary(signedAt)
    .signedByEstablishmentRepresentative(signedAt)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withDateValidation(dateValidation)
    .build();

const buildAssessment = (conventionId: string, totalHours: number) => {
  const dto = new AssessmentDtoBuilder().withConventionId(conventionId).build();
  return {
    dto,
    entity: {
      _entityName: "Assessment" as const,
      numberOfHoursActuallyMade: totalHours,
      ...dto,
    },
  };
};

const buildUserWithRights = (
  ...rights: { agency: AgencyDto; roles: AgencyRole[] }[]
) =>
  new ConnectedUserBuilder()
    .withAgencyRights(
      rights.map(({ agency, roles }) => ({
        agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
        roles,
        isNotifiedByEmail: true,
      })),
    )
    .build();

describe("GetAssessmentsForAgencyUser", () => {
  let getAssessmentsForAgencyUser: GetAssessmentsForAgencyUser;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getAssessmentsForAgencyUser = makeGetAssessmentsForAgencyUser({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  it("returns empty array when user has no agency rights", async () => {
    const user = new ConnectedUserBuilder().withAgencyRights([]).build();

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, []);
  });

  it("returns empty array when user has agency rights with no roles", async () => {
    const agency = new AgencyDtoBuilder().build();
    const user = buildUserWithRights({ agency, roles: [] });

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, []);
  });

  it("returns empty array when no conventions exist for user's agencies", async () => {
    const agency = new AgencyDtoBuilder().build();
    const user = buildUserWithRights({ agency, roles: ["validator"] });

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, []);
  });

  it("returns empty array when conventions exist but have no assessments", async () => {
    const agency = new AgencyDtoBuilder().build();
    const convention = buildAcceptedConvention(
      agency.id,
      "cccc1111-1111-4111-b111-111111111111",
    );
    const user = buildUserWithRights({ agency, roles: ["validator"] });

    uow.conventionRepository.setConventions([convention]);

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, []);
  });

  it("returns assessments for conventions belonging to user's agencies", async () => {
    const agency = new AgencyDtoBuilder().build();
    const convention = buildAcceptedConvention(
      agency.id,
      "cccc1111-1111-4111-b111-111111111111",
    );
    const { dto, entity } = buildAssessment(
      convention.id,
      convention.schedule.totalHours,
    );
    const user = buildUserWithRights({ agency, roles: ["validator"] });

    uow.conventionRepository.setConventions([convention]);
    uow.assessmentRepository.setAssessments([entity]);

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, [dto]);
  });

  it("returns assessments from multiple agencies the user has rights on", async () => {
    const agency1 = new AgencyDtoBuilder()
      .withId("aaaa1111-1111-4111-b111-111111111111")
      .build();
    const agency2 = new AgencyDtoBuilder()
      .withId("aaaa2222-2222-4222-b222-222222222222")
      .build();
    const convention1 = buildAcceptedConvention(
      agency1.id,
      "cccc1111-1111-4111-b111-111111111111",
    );
    const convention2 = buildAcceptedConvention(
      agency2.id,
      "cccc2222-2222-4222-b222-222222222222",
    );
    const assessment1 = buildAssessment(
      convention1.id,
      convention1.schedule.totalHours,
    );
    const assessment2 = buildAssessment(
      convention2.id,
      convention2.schedule.totalHours,
    );
    const user = buildUserWithRights(
      { agency: agency1, roles: ["validator"] },
      { agency: agency2, roles: ["counsellor"] },
    );

    uow.conventionRepository.setConventions([convention1, convention2]);
    uow.assessmentRepository.setAssessments([
      assessment1.entity,
      assessment2.entity,
    ]);

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, [assessment1.dto, assessment2.dto]);
  });

  it("does not return assessments for conventions belonging to agencies the user has no rights on", async () => {
    const userAgency = new AgencyDtoBuilder()
      .withId("aaaa1111-1111-4111-b111-111111111111")
      .build();
    const otherAgency = new AgencyDtoBuilder()
      .withId("aaaa2222-2222-4222-b222-222222222222")
      .build();
    const userConvention = buildAcceptedConvention(
      userAgency.id,
      "cccc1111-1111-4111-b111-111111111111",
    );
    const otherConvention = buildAcceptedConvention(
      otherAgency.id,
      "cccc2222-2222-4222-b222-222222222222",
    );
    const userAssessment = buildAssessment(
      userConvention.id,
      userConvention.schedule.totalHours,
    );
    const otherAssessment = buildAssessment(
      otherConvention.id,
      otherConvention.schedule.totalHours,
    );
    const user = buildUserWithRights({
      agency: userAgency,
      roles: ["validator"],
    });

    uow.conventionRepository.setConventions([userConvention, otherConvention]);
    uow.assessmentRepository.setAssessments([
      userAssessment.entity,
      otherAssessment.entity,
    ]);

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, [userAssessment.dto]);
  });

  it("only considers conventions with ACCEPTED_BY_VALIDATOR status", async () => {
    const agency = new AgencyDtoBuilder().build();
    const acceptedConvention = buildAcceptedConvention(
      agency.id,
      "cccc1111-1111-4111-b111-111111111111",
    );
    const nonAcceptedConvention = new ConventionDtoBuilder()
      .withId("cccc3333-3333-4333-b333-333333333333")
      .withAgencyId(agency.id)
      .withStatus("READY_TO_SIGN")
      .build();
    const { dto, entity } = buildAssessment(
      acceptedConvention.id,
      acceptedConvention.schedule.totalHours,
    );
    const user = buildUserWithRights({ agency, roles: ["validator"] });

    uow.conventionRepository.setConventions([
      nonAcceptedConvention,
      acceptedConvention,
    ]);
    uow.assessmentRepository.setAssessments([entity]);

    const result = await getAssessmentsForAgencyUser.execute(undefined, user);

    expectToEqual(result, [dto]);
  });
});
