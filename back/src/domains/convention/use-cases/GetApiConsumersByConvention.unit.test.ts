import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { ApiConsumerBuilder } from "../../core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  GetApiConsumersByConvention,
  makeGetApiConsumersByConvention,
} from "./GetApiConsumersByConvention";

describe("GetApiConsumersByConvention", () => {
  const userBuilder = new InclusionConnectedUserBuilder();
  const user = userBuilder.buildUser();
  const icUser = userBuilder.build();

  const adminBuilder = new InclusionConnectedUserBuilder().withIsAdmin(true);
  const admin = adminBuilder.buildUser();
  const icAdmin = adminBuilder.build();

  const uuidGenerator = new TestUuidGenerator();

  const ftAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const conventionWithFtAgency = new ConventionDtoBuilder()
    .withAgencyId(ftAgency.id)
    .build();

  let getApiConsumersByConvention: GetApiConsumersByConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(async () => {
    uow = createInMemoryUow();
    getApiConsumersByConvention = makeGetApiConsumersByConvention({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  it("Throw not found error if no convention were found", async () => {
    const fakeConventionId = "649fdf5b-bdb4-4a2d-9680-deb30bacb79a";

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: fakeConventionId },
        icUser,
      ),
      errors.convention.notFound({ conventionId: fakeConventionId }),
    );
  });

  it("Throw not found error if no user were found", async () => {
    const conventionOfAnotherAgency = new ConventionDtoBuilder(
      conventionWithFtAgency,
    )
      .withAgencyId("another-agency")
      .build();
    uow.conventionRepository.setConventions([conventionOfAnotherAgency]);

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: conventionOfAnotherAgency.id },
        icUser,
      ),
      errors.user.notFound({ userId: user.id }),
    );
  });

  it("Throw not found error if no agency were found for convention", async () => {
    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.userRepository.users = [user];

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        icUser,
      ),
      errors.agency.notFound({ agencyId: ftAgency.id }),
    );
  });

  it("return empty array if user doesn't have enough rights on convention", async () => {
    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.agencyRepository.agencies = [toAgencyWithRights(ftAgency)];
    uow.userRepository.users = [user];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        icUser,
      ),
      [],
    );
  });

  it("return an array with France Travail if convention is of kind pole emploi and if user has right on the convention", async () => {
    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(ftAgency, {
        [user.id]: {
          isNotifiedByEmail: true,
          roles: ["validator", "counsellor"],
        },
      }),
    ];
    uow.userRepository.users = [user];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        icUser,
      ),
      ["France Travail"],
    );
  });

  it("return an array with the api partners names link to the convention if user has right on the convention", async () => {
    const now = new Date("2024-07-22");
    const subscriptionId = uuidGenerator.new();
    const miloAgency = new AgencyDtoBuilder()
      .withKind("mission-locale")
      .build();
    const conventionMilo = new ConventionDtoBuilder()
      .withAgencyId(miloAgency.id)
      .build();

    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [miloAgency.id] },
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

    uow.conventionRepository.setConventions([conventionMilo]);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(miloAgency, {
        [user.id]: {
          isNotifiedByEmail: true,
          roles: ["counsellor", "validator"],
        },
      }),
    ];
    uow.userRepository.users = [user];
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionMilo.id },
        icUser,
      ),
      [apiConsumer.name],
    );
  });

  it("return an array with the api partners names link to the convention if user is admin", async () => {
    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [ftAgency.id] },
        subscriptions: [
          {
            id: uuidGenerator.new(),
            createdAt: new Date("2024-07-22").toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();

    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.agencyRepository.agencies = [toAgencyWithRights(ftAgency)];
    uow.userRepository.users = [admin];
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        icAdmin,
      ),
      [apiConsumer.name, "France Travail"],
    );
  });
});
