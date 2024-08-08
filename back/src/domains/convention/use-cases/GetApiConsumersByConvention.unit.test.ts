import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ApiConsumerBuilder } from "../../core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  GetApiConsumersByconvention,
  makeGetApiConsumersByconvention,
} from "./GetApiConsumersByConvention";

describe("GetApiConsumersByConvention", () => {
  const uuidGenerator = new TestUuidGenerator();
  let getApiConsumersByConvention: GetApiConsumersByconvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(async () => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    getApiConsumersByConvention = makeGetApiConsumersByconvention({
      uowPerformer,
    });
  });

  it("Throw not found error if no convention were found", async () => {
    const fakeConventionId = "649fdf5b-bdb4-4a2d-9680-deb30bacb79a";
    const user: InclusionConnectedUser =
      new InclusionConnectedUserBuilder().build();

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: fakeConventionId },
        user,
      ),
      errors.convention.notFound({ conventionId: fakeConventionId }),
    );
  });

  it("Throw not found error if no user were found", async () => {
    const convention = new ConventionDtoBuilder().build();
    const user: InclusionConnectedUser =
      new InclusionConnectedUserBuilder().build();

    uow.conventionRepository.setConventions([convention]);

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      errors.user.notFound({ userId: user.id }),
    );
  });

  it("Throw not found error if no agency were found for convention", async () => {
    const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const user: InclusionConnectedUser =
      new InclusionConnectedUserBuilder().build();

    uow.conventionRepository.setConventions([convention]);
    uow.userRepository.users = [user];

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      errors.agency.notFound({ agencyId: agency.id }),
    );
  });

  it("return empty array if user doesn't have enough rights on convention", async () => {
    const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const user: InclusionConnectedUser =
      new InclusionConnectedUserBuilder().build();

    uow.conventionRepository.setConventions([convention]);
    uow.agencyRepository.agencies = [agency];
    uow.userRepository.users = [user];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      [],
    );
  });

  it("return an array with France Travail if convention is of kind pole emploi and if user has right on the convention", async () => {
    const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const user: InclusionConnectedUser = new InclusionConnectedUserBuilder()
      .withAgencyRights([
        {
          agency: agency,
          roles: ["validator", "counsellor"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    uow.conventionRepository.setConventions([convention]);
    uow.agencyRepository.agencies = [agency];
    uow.userRepository.setInclusionConnectedUsers([user]);

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      ["France Travail"],
    );
  });

  it("return an array with the api partners names link to the convention if user has right on the convention", async () => {
    const now = new Date("2024-07-22");
    const subscriptionId = uuidGenerator.new();
    const agency = new AgencyDtoBuilder().withKind("mission-locale").build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const user: InclusionConnectedUser = new InclusionConnectedUserBuilder()
      .withAgencyRights([
        {
          agency: agency,
          roles: ["validator", "counsellor"],
          isNotifiedByEmail: true,
        },
      ])
      .build();
    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [agency.id] },
        subscriptions: [
          {
            id: subscriptionId,
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();

    uow.conventionRepository.setConventions([convention]);
    uow.agencyRepository.agencies = [agency];
    uow.userRepository.setInclusionConnectedUsers([user]);
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      ["si-milo-production"],
    );
  });

  it("return an array with the api partners names link to the convention if user is admin", async () => {
    const now = new Date("2024-07-22");
    const subscriptionId = uuidGenerator.new();
    const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    const user: InclusionConnectedUser = new InclusionConnectedUserBuilder()
      .withIsAdmin(true)
      .build();
    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [agency.id] },
        subscriptions: [
          {
            id: subscriptionId,
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();

    uow.conventionRepository.setConventions([convention]);
    uow.agencyRepository.agencies = [agency];
    uow.userRepository.setInclusionConnectedUsers([user]);
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: convention.id },
        user,
      ),
      ["si-milo-production", "France Travail"],
    );
  });
});
