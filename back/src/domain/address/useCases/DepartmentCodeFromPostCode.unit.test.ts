import { DepartmentCodeFromPostcodeQuery } from "shared/src/address/address.query";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
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

    const findDepartmentCodeFromPostCodeQuery: DepartmentCodeFromPostcodeQuery =
      "75001";

    expectTypeToMatchAndEqual(
      await useCase.execute(findDepartmentCodeFromPostCodeQuery),
      {
        departmentCode: expectedDepartmentCode,
      },
    );
  });
});
