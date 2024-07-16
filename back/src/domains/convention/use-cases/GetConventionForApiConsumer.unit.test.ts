import { addYears } from "date-fns";
import {
  AgencyDtoBuilder,
  ApiConsumer,
  ApiConsumerRights,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ForbiddenError, NotFoundError } from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
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
  name: "pole-emploi",
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
    searchEstablishment: { kinds: [], scope: "no-scope", subscriptions: [] },
    convention: conventionRight,
    statistics: { kinds: [], scope: "no-scope", subscriptions: [] },
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
    uow.conventionRepository.setConventions([convention]);
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
            subscriptions: [],
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
            subscriptions: [],
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
              subscriptions: [],
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
          subscriptions: [],
        }),
      );

      expectToEqual(retrievedConvention, {
        ...convention,
        agencyName: agency.name,
        agencyDepartment: agency.address.departmentCode,
        agencyKind: agency.kind,
        agencySiret: agency.agencySiret,
        agencyCounsellorEmails: agency.counsellorEmails,
        agencyValidatorEmails: agency.validatorEmails,
      });
    });

    it("when agencyKinds scope matches", async () => {
      const retrievedConvention = await getConventionForApiConsumer.execute(
        { conventionId: convention.id },
        createApiConsumer({
          kinds: ["READ"],
          scope: { agencyKinds: [agency.kind] },
          subscriptions: [],
        }),
      );

      expectToEqual(retrievedConvention, {
        ...convention,
        agencyName: agency.name,
        agencyDepartment: agency.address.departmentCode,
        agencyKind: agency.kind,
        agencySiret: agency.agencySiret,
        agencyCounsellorEmails: agency.counsellorEmails,
        agencyValidatorEmails: agency.validatorEmails,
      });
    });
  });
});
