import { subMonths } from "date-fns";
import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionReadDto,
  type DataWithPagination,
  expectToEqual,
  type GetConventionsForAgencyUserParams,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetConventionsForAgencyUser } from "./GetConventionsForAgencyUser";

const expectOnlyConventionInResult = (
  result: DataWithPagination<ConventionReadDto>,
  convention: ConventionDto,
) => {
  expect(result.data).toHaveLength(1);
  expect(result.data[0]?.id).toBe(convention.id);
  expect(result.data[0]?.dateEnd).toBe(convention.dateEnd);
};

describe("GetConventionsForAgencyUser", () => {
  const agencyUserId = "agency-user-id-12345";
  const currentUser = new ConnectedUserBuilder()
    .withId(agencyUserId)
    .withEmail("counsellor1@email.com")
    .withFirstName("John")
    .withLastName("Doe")
    .build();

  const agency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
      .withName("Test Agency")
      .withKind("pole-emploi")
      .build(),
    {
      [agencyUserId]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const conventions = Array.from({ length: 30 }, (_, i) =>
    new ConventionDtoBuilder()
      .withId(`convention-id-${i + 1}`)
      .withAgencyId(agency.id)
      .withStatus(i % 2 === 0 ? "ACCEPTED_BY_VALIDATOR" : "READY_TO_SIGN")
      .build(),
  );

  let getConventionsForAgencyUser: ReturnType<
    typeof makeGetConventionsForAgencyUser
  >;
  let timeGateway: TimeGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const uowPerformer = new InMemoryUowPerformer(uow);
    getConventionsForAgencyUser = makeGetConventionsForAgencyUser({
      uowPerformer,
      deps: {
        timeGateway,
      },
    });

    uow.agencyRepository.agencies = [agency];
    uow.userRepository.users = [currentUser];
    uow.conventionRepository.setConventions(conventions);
  });

  describe("Filtering", () => {
    it("should filter out conventions that are older than 25 months by default", async () => {
      const conventionOutOfRange = new ConventionDtoBuilder()
        .withId("convention-id-1")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 26).toISOString())
        .build();
      const conventionInRange = new ConventionDtoBuilder()
        .withId("convention-id-2")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 24).toISOString())
        .build();

      uow.conventionRepository.setConventions([
        conventionOutOfRange,
        conventionInRange,
      ]);

      const params: GetConventionsForAgencyUserParams = {
        filters: {},
        pagination: {
          page: 1,
          perPage: 10,
        },
      };

      const result = await getConventionsForAgencyUser.execute(
        params,
        currentUser,
      );

      expectOnlyConventionInResult(result, conventionInRange);
      expectToEqual(result.pagination, {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 1,
      });
    });

    it("should keep and override dateEnd from if provided and less or equal to defaultMonthsThreshold", async () => {
      const conventionOutOfRange = new ConventionDtoBuilder()
        .withId("convention-id-1")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 14).toISOString())
        .build();
      const conventionInRange = new ConventionDtoBuilder()
        .withId("convention-id-2")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 12).toISOString())
        .build();

      uow.conventionRepository.setConventions([
        conventionOutOfRange,
        conventionInRange,
      ]);

      const params: GetConventionsForAgencyUserParams = {
        filters: {
          dateEnd: {
            from: subMonths(timeGateway.now(), 13).toISOString(),
          },
        },
        pagination: {
          page: 1,
          perPage: 10,
        },
      };

      const result = await getConventionsForAgencyUser.execute(
        params,
        currentUser,
      );

      expectOnlyConventionInResult(result, conventionInRange);
      expectToEqual(result.pagination, {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 1,
      });
    });

    it("shouldn't take into account dateEnd to if provided and greater than defaultMonthsThreshold", async () => {
      const conventionOutOfRange = new ConventionDtoBuilder()
        .withId("convention-id-1")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 26).toISOString())
        .build();
      const conventionInRange = new ConventionDtoBuilder()
        .withId("convention-id-2")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(timeGateway.now(), 24).toISOString())
        .build();

      uow.conventionRepository.setConventions([
        conventionOutOfRange,
        conventionInRange,
      ]);

      const params: GetConventionsForAgencyUserParams = {
        filters: {
          dateEnd: {
            to: subMonths(timeGateway.now(), 30).toISOString(),
          },
        },
        pagination: {
          page: 1,
          perPage: 10,
        },
      };

      const result = await getConventionsForAgencyUser.execute(
        params,
        currentUser,
      );

      expectOnlyConventionInResult(result, conventionInRange);
      expectToEqual(result.pagination, {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 1,
      });
    });
  });
});
