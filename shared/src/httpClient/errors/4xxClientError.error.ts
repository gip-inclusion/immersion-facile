export class HttpClientError extends Error {
  constructor(
    public override readonly message: string,
    public override readonly cause?: Error,
  ) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}
