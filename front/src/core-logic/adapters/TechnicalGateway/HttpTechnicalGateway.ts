import { AxiosInstance, AxiosResponse } from "axios";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags, featureFlagsSchema } from "shared/src/featureFlags";
import { getFeatureFlags, uploadFileRoute } from "shared/src/routes";
import { from, map, Observable } from "rxjs";
export class HttpTechnicalGateway implements TechnicalGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  async uploadLogo(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await this.httpClient.post(
      `/${uploadFileRoute}`,
      formData,
    );
    return data;
  }

  getAllFeatureFlags = (): Observable<FeatureFlags> =>
    from(this.httpClient.get<unknown>(`/${getFeatureFlags}`)).pipe(
      map(validateFeatureFlags),
    );
}
const validateFeatureFlags = ({ data }: AxiosResponse<unknown>): FeatureFlags =>
  featureFlagsSchema.parse(data);
