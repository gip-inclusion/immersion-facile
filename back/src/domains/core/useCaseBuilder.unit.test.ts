import z from "zod";
import { createInMemoryUow } from "./unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "./unit-of-work/adapters/InMemoryUowPerformer";
import { useCaseBuilder } from "./useCaseBuilder";

describe("useCaseBuilder", () => {
  it("should be able to define a working usecase", async () => {
    const uow = createInMemoryUow();
    const makeAddTruc = useCaseBuilder("AddTruc")
      .withInput(z.object({ truc: z.string() }))
      .withOutput<boolean>()
      .withDeps<{ getBidule: () => string }>()
      .withCurrentUser<{ id: string; email: string }>()
      .build(async ({ inputParams, currentUser, uow, deps }) => {
        if (currentUser.email.includes("@example.com"))
          throw new Error("Bad user");
        const b = deps.getBidule();
        const count = await uow.outboxRepository.countAllEvents({
          status: "in-process",
        });
        return b.length >= count && inputParams.truc.length > 0;
      });

    const addTruc = makeAddTruc({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { getBidule: () => "bidule" },
    });

    const result = await addTruc.execute(
      { truc: "yo" },
      { id: "123", email: "st@mail.com" },
    );

    expect(result).toBe(true);
  });
});
