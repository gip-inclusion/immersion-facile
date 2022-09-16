import { AxiosInstance } from "axios";
import {
  AddressAndPosition,
  DepartmentCode,
} from "shared/src/address/address.dto";
import {
  lookupAddressQueryParam,
  postCodeQueryParam,
} from "shared/src/address/address.query";
import { findDepartmentCodeFromPostcodeResponseSchema } from "shared/src/address/address.response";
import { addressAndPositionListSchema } from "shared/src/address/address.schema";
import {
  departmentCodeFromPostcodeRoute,
  lookupStreetAddressRoute,
} from "shared/src/routes";
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
