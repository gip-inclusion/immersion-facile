export class UnhandledError extends Error {
  constructor(
    public override readonly message: string = "Unhandled Error",
    public override readonly cause: Error,
  ) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}
