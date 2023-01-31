import {
  AddressAndPosition,
  addressAndPositionListSchema,
  AddressTargets,
  DepartmentCode,
  findDepartmentCodeFromPostcodeResponseSchema,
  LookupLocationInput,
  LookupSearchResult,
  lookupSearchResultsSchema,
} from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";
import { HttpClient } from "http-client";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: HttpClient<AddressTargets>) {}

  public async lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });
    return lookupSearchResultsSchema.parse(response.responseBody);
  }

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
      },
    });
    return addressAndPositionListSchema.parse(response.responseBody);
  }

  public async findDepartmentCodeFromPostCode(
    postcode: string,
  ): Promise<DepartmentCode | null> {
    //TODO Remove catch to differentiate between http & domain errors
    try {
      const response = await this.httpClient.departmentCodeFromPostcode({
        queryParams: {
          postcode,
        },
      });
      return findDepartmentCodeFromPostcodeResponseSchema.parse(
        response.responseBody,
      ).departmentCode;
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return null;
    }
  }
}
