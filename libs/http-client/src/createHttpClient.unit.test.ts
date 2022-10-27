import { createInMemoryHandlerCreator } from "./adapters/createInMemoryHandlerCreator";
import type { CreateTargets, HttpClient, Target } from "./createHttpClient";
import { createHttpClient } from "./createHttpClient";

type Book = {
  name: string;
};

type Car = {
  horsePower: number;
};

type MyBookEndpoints = CreateTargets<{
  addBook: Target<void, Book, void, { authorization: string }>;
  getBooks: Target<Book[], void, { max?: number }>;
  getBook: Target<
    Book | undefined,
    void,
    void,
    void,
    "https://www.truc.com/book/:bookId"
  >;
  getCar: Target<Car | undefined, void, void, void, "/car/:carId">;
  getSomethingWithNoParams: Target<string>;
}>;

const isBook = (book: any): Book | never => {
  if (typeof book?.name !== "string") {
    throw new Error("Is not a book");
  }
  return book;
};

const isCar = (car: any): Car | never => {
  if (typeof car?.horsePower !== "number") {
    throw new Error("Is not a car");
  }
  return car;
};

describe("http-client", () => {
  let httpClient: HttpClient<MyBookEndpoints>;
  let inMemory: ReturnType<typeof createInMemoryHandlerCreator>;

  beforeEach(() => {
    inMemory = createInMemoryHandlerCreator();

    httpClient = createHttpClient<MyBookEndpoints>(inMemory.handlerCreator, {
      addBook: {
        method: "POST",
        url: "https://www.truc.com",
      },
      getBooks: {
        method: "GET",
        url: "https://www.truc.com",
        validateResponseBody: (responseBody): Book[] => {
          if (!(responseBody instanceof Array) || !responseBody.every(isBook))
            throw new Error("Not a list of Book");
          return responseBody;
        },
      },
      getBook: {
        method: "GET",
        url: "https://www.truc.com/book/:bookId",
        validateResponseBody: isBook,
      },
      getCar: {
        method: "GET",
        url: "/car/:carId",
        validateResponseBody: isCar,
      },
      getSomethingWithNoParams: {
        method: "GET",
        url: "/yolo",
        validateResponseBody: (v) => v as string,
      },
    });
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

  it("throws error if validation was not fine", async () => {
    inMemory.setResponse({
      status: 200,
      responseBody: [{ message: "This is not the same" }],
    });
    const promise = httpClient.getBooks({ queryParams: {} });

    await expect(promise).rejects.toThrow(new Error("Is not a book"));
  });

  it("gets something without params", async () => {
    const givenResponse = { responseBody: "worked", status: 200 };
    inMemory.setResponse(givenResponse);
    const response = await httpClient.getSomethingWithNoParams();
    expectToEqual(response, givenResponse);
  });
});

const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};
