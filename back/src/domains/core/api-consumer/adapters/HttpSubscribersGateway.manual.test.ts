import axios from "axios";
import { ConventionDtoBuilder, ConventionReadDto } from "shared";
import { HttpSubscribersGateway } from "./HttpSubscribersGateway";

describe("HttpSubscribersGateway", () => {
  let httpSubscribersGateway: HttpSubscribersGateway;

  it("send notification", async () => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    const conventionReadDto: ConventionReadDto = {
      ...new ConventionDtoBuilder().build(),
      agencyName: "Agence de test",
      agencyDepartment: "75",
      agencyKind: "mission-locale",
      agencySiret: "11112222000033",
      agencyCounsellorEmails: [],
      agencyValidatorEmails: ["validator@mail.com"],
      agencyRefersTo: undefined,
    };

    const response = await httpSubscribersGateway.notify(
      {
        payload: { convention: conventionReadDto },
        subscribedEvent: "convention.updated",
      },
      {
        callbackUrl: "https://jsonplaceholder.typicode.com/posts",
        callbackHeaders: {
          authorization: "my-cb-auth-header",
        },
      },
    );

    expect(response).toBeUndefined();
  });
});
