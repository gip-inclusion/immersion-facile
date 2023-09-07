import { addYears } from "date-fns";
import {
  AgencyDtoBuilder,
  ApiConsumer,
  ApiConsumerRights,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetConventionForApiConsumer } from "./GetConventionForApiConsumer";

const agencyIdInScope = "agency-id-in-scope";
const agency = new AgencyDtoBuilder()
  .withId(agencyIdInScope)
  .withKind("pole-emploi")
  .build();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agencyIdInScope)
  .build();

const createApiConsumer = (
  conventionRight: ApiConsumerRights["convention"],
): ApiConsumer => ({
  id: "my-api-consumer-id",
  description: "Some description",
  consumer: "pole-emploi",
  createdAt: new Date().toISOString(),
  expirationDate: addYears(new Date(), 2).toISOString(),
  contact: {
    firstName: "John",
    lastName: "Doe",
    job: "job",
    emails: ["john.doe@mail.com"],
    phone: "0601010101",
  },
  rights: {
    searchEstablishment: { kinds: [], scope: "no-scope" },
    convention: conventionRight,
  },
});

describe("Get Convention for ApiConsumer", () => {
  let getConventionForApiConsumer: GetConventionForApiConsumer;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConventionForApiConsumer = new GetConventionForApiConsumer(
      new InMemoryUowPerformer(uow),
    );
    uow.agencyRepository.setAgencies([agency]);
    uow.conventionRepository.setConventions({
      [convention.id]: convention,
    });
  });

  describe("Wrong paths", () => {
    describe("Forbidden error", () => {
      it("When no api consumer is provided", async () => {
        await expectPromiseToFailWithError(
          getConventionForApiConsumer.execute({ conventionId: convention.id }),
          new ForbiddenError("No api consumer provided"),
        );
      });

      describe("When convention is not in the scope of the api consumer", () => {
        it("convention is linked to an agency with an Id which is not", async () => {
          const apiConsumer = createApiConsumer({
            kinds: ["READ"],
            scope: { agencyIds: ["another-agency-id"] },
          });
          await expectPromiseToFailWithError(
            getConventionForApiConsumer.execute(
              { conventionId: convention.id },
              apiConsumer,
            ),
            new ForbiddenError(
              `You are not allowed to access convention : ${convention.id}`,
            ),
          );
        });

        it("convention is linked to an agency with a kind not in scope", async () => {
          const apiConsumer = createApiConsumer({
            kinds: ["READ"],
            scope: { agencyKinds: ["mission-locale"] },
          });
          await expectPromiseToFailWithError(
            getConventionForApiConsumer.execute(
              { conventionId: convention.id },
              apiConsumer,
            ),
            new ForbiddenError(
              `You are not allowed to access convention : ${convention.id}`,
            ),
          );
        });
      });
    });

    describe("Not found error", () => {
      it("When the Convention does not exist", async () => {
        const notFoundId = "40400000-4000-4000-4000-400000000404";
        await expectPromiseToFailWithError(
          getConventionForApiConsumer.execute(
            { conventionId: notFoundId },
            createApiConsumer({
              kinds: ["READ"],
              scope: { agencyIds: [agency.id] },
            }),
          ),
          new NotFoundError(`No convention found with id ${notFoundId}`),
        );
      });
    });
  });

  describe("Right path", () => {
    it("when agencyIds scope matches", async () => {
      const retrievedConvention = await getConventionForApiConsumer.execute(
        { conventionId: convention.id },
        createApiConsumer({
          kinds: ["READ"],
          scope: { agencyIds: [agency.id] },
        }),
      );

      expectToEqual(retrievedConvention, {
        ...convention,
        agencyName: agency.name,
        agencyDepartment: agency.address.departmentCode,
      });
    });

    it("when agencyKinds scope matches", async () => {
      const retrievedConvention = await getConventionForApiConsumer.execute(
        { conventionId: convention.id },
        createApiConsumer({
          kinds: ["READ"],
          scope: { agencyKinds: [agency.kind] },
        }),
      );

      expectToEqual(retrievedConvention, {
        ...convention,
        agencyName: agency.name,
        agencyDepartment: agency.address.departmentCode,
      });
    });
  });
});
