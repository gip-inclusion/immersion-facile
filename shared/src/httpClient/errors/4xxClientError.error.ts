export class HttpClientError extends Error {
  constructor(
    public override readonly message: string,
    public override readonly cause: Error,
    //TODO Restrict to valid HttpStatusCodeError
    public readonly httpStatusCode: number,
    public readonly data: any | undefined,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}
