import { ConventionDtoBuilder } from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type MarkOldConventionAsDeprecated,
  makeMarkOldConventionAsDeprecated,
} from "./MarkOldConventionAsDeprecated";

describe("MarkOldConventionAsDeprecated", () => {
  let uow: InMemoryUnitOfWork;
  let markOldConventionAsDeprecated: MarkOldConventionAsDeprecated;

  beforeEach(() => {
    uow = createInMemoryUow();
    markOldConventionAsDeprecated = makeMarkOldConventionAsDeprecated({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  it("should mark old conventions as deprecated", async () => {
    const conventionToDeprecate = new ConventionDtoBuilder()
      .withId("11111111-1111-4111-a111-111111111111")
      .withStatus("PARTIALLY_SIGNED")
      .withDateEnd(new Date("2025-02-14").toISOString())
      .build();
    const conventionToKeep = new ConventionDtoBuilder()
      .withId("11111111-1111-4111-a111-111111111112")
      .withStatus("PARTIALLY_SIGNED")
      .withDateEnd(new Date("2025-04-14").toISOString())
      .build();
    uow.conventionRepository.setConventions([
      conventionToDeprecate,
      conventionToKeep,
    ]);

    const result = await markOldConventionAsDeprecated.execute({
      deprecateSince: new Date("2025-03-15"),
    });

    expect(result.numberOfUpdatedConventions).toBe(1);
    const deprecatedConvention = await uow.conventionRepository.getById(
      conventionToDeprecate.id,
    );
    expect(deprecatedConvention.status).toEqual("DEPRECATED");
    expect(deprecatedConvention.statusJustification).toEqual(
      "Devenu obsolète car statut PARTIALLY_SIGNED alors que la date de fin est dépassée depuis longtemps",
    );
  });
});
