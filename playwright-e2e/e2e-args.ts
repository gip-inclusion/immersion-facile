const customFlags = ["--dev", "--reset", "--stop"] as const;

type E2eArgs = {
  flags: {
    dev: boolean;
    reset: boolean;
    stop: boolean;
  };
  playwrightArgs: string[];
};

export const parseE2eArgs = (args: string[]): E2eArgs => {
  const flags = {
    dev: args.includes("--dev"),
    reset: args.includes("--reset"),
    stop: args.includes("--stop"),
  };
  const playwrightArgs = args.filter(
    (arg) => !customFlags.includes(arg as (typeof customFlags)[number]),
  );
  return { flags, playwrightArgs };
};
