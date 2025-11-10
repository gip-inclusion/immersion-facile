import {
  AgencyDtoBuilder,
  type BroadcastFeedback,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetConventionsWithErroredBroadcastFeedbackForAgencyUser } from "./GetConventionsWithErroredBroadcastFeedbackForAgencyUser";

describe("ConventionsWithErroredBroadcastFeedback", () => {
  const currentUser = new ConnectedUserBuilder()
    .withId("agency-user-id")
    .withEmail("counsellor1@email.com")
    .withFirstName("John")
    .withLastName("Doe")
    .build();
  let getConventionsWithErroredBroadcastFeedbackForAgencyUser: ReturnType<
    typeof makeGetConventionsWithErroredBroadcastFeedbackForAgencyUser
  >;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    getConventionsWithErroredBroadcastFeedbackForAgencyUser =
      makeGetConventionsWithErroredBroadcastFeedbackForAgencyUser({
        uowPerformer,
      });
  });

  it("should return the errored conventions for the agency user", async () => {
    const agency = new AgencyDtoBuilder().build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const broadcastFeedback: BroadcastFeedback = {
      consumerId: null,
      consumerName: "any-consumer-name",
      serviceName:
        "FranceTravailGateway.notifyOnConventionUpdatedOrAssessmentCreated",
      occurredAt: "2024-07-01T00:00:00.000Z",
      handledByAgency: true,
      requestParams: {
        conventionId: convention.id,
        conventionStatus: "READY_TO_SIGN",
      },
      subscriberErrorFeedback: {
        message: "any-error-message-1",
        error: { code: "ANY_ERROR_CODE_1" },
      },
      response: {
        httpStatus: 500,
        body: { error: "ANY_ERROR_CODE_1" },
      },
    };
    uow.conventionRepository.setConventions([convention]);
    uow.userRepository.users = [currentUser];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [currentUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    uow.broadcastFeedbacksRepository.broadcastFeedbacks = [broadcastFeedback];

    const result =
      await getConventionsWithErroredBroadcastFeedbackForAgencyUser.execute(
        { page: 1, perPage: 10 },
        currentUser,
      );

    expect(result).toEqual({
      data: [
        {
          id: convention.id,
          beneficiary: {
            firstname: convention.signatories.beneficiary.firstName,
            lastname: convention.signatories.beneficiary.lastName,
          },
          broadcastFeedback: broadcastFeedback,
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
