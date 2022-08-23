export class ConfigurationError extends Error {
  constructor(
    public override readonly message: string = "Invalid configuration",
    public override readonly cause?: Error,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = "ConfigurationError";
    this.message = message;
  }
}
