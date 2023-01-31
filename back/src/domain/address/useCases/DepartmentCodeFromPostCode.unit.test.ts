import { expectTypeToMatchAndEqual } from "shared";

import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { DepartmentCodeFromPostcode } from "./DepartmentCodeFromPostCode";

describe("Department Code From Postcode", () => {
  let useCase: DepartmentCodeFromPostcode;
  let addressApiGateway: InMemoryAddressGateway;

  beforeEach(() => {
    addressApiGateway = new InMemoryAddressGateway();
    useCase = new DepartmentCodeFromPostcode(addressApiGateway);
  });

  it("retrieve Street and Addresse from query ''", async () => {
    const expectedDepartmentCode = "75";
    addressApiGateway.setDepartmentCode(expectedDepartmentCode);

    expectTypeToMatchAndEqual(await useCase.execute({ postcode: "75001" }), {
      departmentCode: expectedDepartmentCode,
    });
  });
});
