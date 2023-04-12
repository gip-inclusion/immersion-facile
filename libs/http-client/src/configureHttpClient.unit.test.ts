import { createInMemoryHandlerCreator } from "./adapters/createInMemoryHandlerCreator";
import type { HttpClient } from "./configureHttpClient";
import {
  configureHttpClient,
  createTarget,
  createTargets,
} from "./configureHttpClient";

type Book = { name: string };
type Car = { horsePower: number };

const isBook = (obj: unknown): Book => {
  if (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof obj.name === "string"
  )
    return { name: obj.name };

  throw new Error("Not a Book");
};

const isBookArray = (obj: unknown): Book[] => {
  if (obj instanceof Array) return obj.map(isBook);
  throw new Error("Not a Book Array");
};

const isCar = (obj: unknown): Car => {
  if (
    typeof obj === "object" &&
    obj !== null &&
    "horsePower" in obj &&
    typeof obj.horsePower === "number"
  )
    return { horsePower: obj.horsePower };

  throw new Error("Not a Car");
};

const hasAuthorizationHeader = (
  headers: unknown,
): { authorization: string } => {
  if (
    typeof headers === "object" &&
    headers !== null &&
    "authorization" in headers &&
    typeof headers.authorization === "string"
  )
    return { authorization: headers.authorization };
  throw new Error("No valid authorization header");
};

const hasMax = (queryParams: unknown): { max?: number } => {
  if (
    typeof queryParams === "object" &&
    queryParams !== null &&
    "max" in queryParams &&
    typeof queryParams.max === "number"
  )
    return { max: queryParams.max };
  return {};
};

const targets = createTargets({
  addBook: createTarget({
    method: "POST",
    url: "https://www.truc.com",
    validateRequestBody: isBook,
    validateHeaders: hasAuthorizationHeader,
  }),
  getBooks: createTarget({
    method: "GET",
    url: "https://www.truc.com",
    validateQueryParams: hasMax,
    validateResponseBody: isBookArray,
  }),
  getBook: createTarget({
    method: "GET",
    url: "https://www.truc.com/book/:bookId",
    validateResponseBody: isBook,
  }),
  getCar: createTarget({
    method: "GET",
    url: "/car/:carId",
    validateResponseBody: isCar,
  }),
  getSomethingWithNoParams: createTarget({
    method: "GET",
    url: "/i-have-no-params",
  }),
});

describe("http-client", () => {
  let httpClient: HttpClient<typeof targets>;
  let inMemory: ReturnType<typeof createInMemoryHandlerCreator>;

  beforeEach(() => {
    inMemory = createInMemoryHandlerCreator();
    const createHttpClient = configureHttpClient(inMemory.handlerCreator);
    httpClient = createHttpClient(targets);
  });

  it("calls the api targets with a typed interface", async () => {
    const book: Book = {
      name: "La horde du contrevent",
    };

    const addBookParams = {
      body: book,
      headers: { authorization: "bob" },
    };
    const addBookResponse = await httpClient.addBook(addBookParams);

    expect(inMemory.calls).toHaveLength(1);
    expectToEqual(inMemory.calls[0], {
      callParams: addBookParams,
      targetName: "POST https://www.truc.com",
    });
    expect(addBookResponse.status).toBe(201);
    expect(addBookResponse.responseBody).toBeUndefined();

    const books: Book[] = [{ name: "yo le livre" }];
    inMemory.setResponse({ status: 200, responseBody: books });
    const getBookParams = {
      queryParams: { max: 10 },
    };
    const getBookResponse = await httpClient.getBooks(getBookParams);

    expect(inMemory.calls).toHaveLength(2);
    expectToEqual(inMemory.calls[1], {
      callParams: getBookParams,
      targetName: "GET https://www.truc.com",
    });
    expect(getBookResponse.status).toBe(200);
    expectToEqual(getBookResponse.responseBody, books);
  });

  it("works with route with params", async () => {
    const book: Book = { name: "my name" };
    inMemory.setResponse({
      status: 200,
      responseBody: book,
    });
    await httpClient.getBook({
      urlParams: { bookId: "yolo" },
    });

    expect(inMemory.calls).toHaveLength(1);
    expectToEqual(inMemory.calls[0], {
      targetName: "GET https://www.truc.com/book/yolo",
      callParams: {
        urlParams: { bookId: "yolo" },
      },
    });
  });

  it("works with route with params and not an Absolute Url", async () => {
    const car: Car = { horsePower: 200 };
    const responseGiven = {
      status: 200,
      responseBody: car,
    };
    inMemory.setResponse(responseGiven);
    const response = await httpClient.getCar({ urlParams: { carId: "123" } });

    expectToEqual(response, responseGiven);
    expect(inMemory.calls).toHaveLength(1);
    expectToEqual(inMemory.calls[0], {
      targetName: "GET /car/123",
      callParams: {
        urlParams: { carId: "123" },
      },
    });
  });

  it("gets something without params", async () => {
    const givenResponse = { responseBody: undefined, status: 200 };
    inMemory.setResponse(givenResponse);
    const response = await httpClient.getSomethingWithNoParams();
    expectToEqual(response, givenResponse);
  });
});

const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};
