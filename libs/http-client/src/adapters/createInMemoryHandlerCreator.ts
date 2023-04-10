import type {
  HandlerCreator,
  HandlerParams,
  HttpResponse,
  UnknownTarget,
} from "../configureHttpClient";

type Call = {
  targetName: string;
  callParams: Partial<HandlerParams<UnknownTarget>>;
};

export const createInMemoryHandlerCreator = () => {
  const calls: Call[] = [];
  let response: HttpResponse<unknown> = {
    status: 201,
    responseBody: undefined,
  };
  const setResponse = <T>(newResponse: HttpResponse<T>): void => {
    response = newResponse;
  };

  const handlerCreator: HandlerCreator = (target) => (params) => {
    calls.push({
      callParams: params,
      targetName: `${target.method} ${target.url}`,
    });
    return Promise.resolve(response as any);
  };

  return {
    calls,
    setResponse,
    handlerCreator,
  };
};
