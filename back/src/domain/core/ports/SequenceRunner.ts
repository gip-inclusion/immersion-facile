export type SequenceRunner = {
  run: <Input, Output>(
    params: Input[],
    cb: (param: Input) => Promise<Output>,
  ) => Promise<Array<Output | undefined>>;
};
