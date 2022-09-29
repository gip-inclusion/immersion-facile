import { AxiosInstance } from "axios";
import {
  AddressAndPosition,
  addressAndPositionListSchema,
  DepartmentCode,
  departmentCodeFromPostcodeRoute,
  findDepartmentCodeFromPostcodeResponseSchema,
  lookupAddressQueryParam,
  lookupStreetAddressRoute,
  postCodeQueryParam,
} from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    const { data } = await this.httpClient.get<unknown>(
      "/api" + lookupStreetAddressRoute,
      {
        params: { [lookupAddressQueryParam]: lookup },
      },
    );
    return addressAndPositionListSchema.parse(data);
  }

  public async findDepartmentCodeFromPostCode(
    query: string,
  ): Promise<DepartmentCode | null> {
    //TODO Remove catch to differentiate between http & domain errors
    try {
      const { data } = await this.httpClient.get<unknown>(
        "/api" + departmentCodeFromPostcodeRoute,
        {
          params: { [postCodeQueryParam]: query },
        },
      );
      return findDepartmentCodeFromPostcodeResponseSchema.parse(data)
        .departmentCode;
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return null;
    }
  }
}
