import z from "zod";
import { createInMemoryUow } from "./unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "./unit-of-work/adapters/InMemoryUowPerformer";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "./useCaseBuilder";

const isExpectedType = <ExpectedType>(_: ExpectedType) => true;

describe("useCaseBuilder", () => {
  it("should be able to define a working usecase, and force types to be correct", async () => {
    const uow = createInMemoryUow();
    const inputSchema = z.object({ truc: z.string() });
    type Input = z.infer<typeof inputSchema>;
    type Output = boolean;
    type Deps = { getBidule: () => string };
    type CurrentUser = { id: string; email: string };

    const makeAddTruc = useCaseBuilder("AddTruc")
      .withInput(z.object({ truc: z.string() }))
      .withOutput<boolean>()
      .withDeps<{ getBidule: () => string }>()
      .withCurrentUser<{ id: string; email: string }>()
      .build(async ({ inputParams, currentUser, uow, deps }) => {
        isExpectedType<Input>(inputParams);
        isExpectedType<CurrentUser>(currentUser);
        isExpectedType<Deps>(deps);
        isExpectedType<UnitOfWork>(uow);

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

    isExpectedType<Output>(result);

    expect(result).toBe(true);
  });

  it("should infer type from return type of build", async () => {
    const makeOtherAddTruc = useCaseBuilder("OtherAddTruc").build(
      async ({ inputParams, currentUser, uow, deps }) => {
        isExpectedType<void>(inputParams);
        isExpectedType<void>(currentUser);
        isExpectedType<void>(deps);
        isExpectedType<UnitOfWork>(uow);
        return "hey" as const;
      },
    );

    const uow = createInMemoryUow();
    const otherAddTruc = makeOtherAddTruc({
      uowPerformer: new InMemoryUowPerformer(uow),
    });

    const result = await otherAddTruc.execute();
    isExpectedType<"hey">(result);
  });

  it("should work with notTransactional use cases", async () => {
    const inputSchema = z.object({ name: z.string() });
    type Input = z.infer<typeof inputSchema>;
    type Output = string;
    type Deps = { getGreeting: () => string };
    type CurrentUser = { id: string; email: string };

    const makeGreetUser = useCaseBuilder("GreetUser")
      .withInput(inputSchema)
      .withOutput<Output>()
      .withDeps<Deps>()
      .withCurrentUser<CurrentUser>()
      .notTransactional()
      .build(async ({ inputParams, currentUser, deps }) => {
        isExpectedType<Input>(inputParams);
        isExpectedType<CurrentUser>(currentUser);
        isExpectedType<Deps>(deps);
        // uow should not be available
        return `${deps.getGreeting()} ${inputParams.name} from ${currentUser.email}`;
      });

    const greetUser = makeGreetUser({
      deps: { getGreeting: () => "Hello" },
      // uowPerformer should not be required
    });

    const result = await greetUser.execute(
      { name: "World" },
      { id: "123", email: "test@example.com" },
    );

    isExpectedType<Output>(result);
    expect(result).toBe("Hello World from test@example.com");
  });

  it("should work with notTransactional use cases without deps", async () => {
    const makeSimpleUseCase = useCaseBuilder("SimpleUseCase")
      .withInput(z.object({ value: z.number() }))
      .notTransactional()
      .build(async ({ inputParams }) => inputParams.value * 2);

    const simpleUseCase = makeSimpleUseCase({});

    const result = await simpleUseCase.execute({ value: 5 });
    expect(result).toBe(10);
  });
});
