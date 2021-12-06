import axios from "axios";
import { ApiAdresseGateway } from "../ports/ApiAdresseGateway";

export class HttpApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(query: string): Promise<string[]> {
    const response = await axios.get(
      "https://api-adresse.data.gouv.fr/search/",
      {
        params: {
          q: query,
        },
      },
    );

    return response.data.features
      .map(featureToStreetAddress)
      .filter((el: any) => !!el);
  }
}

const featureToStreetAddress = (feature: any): string | undefined => {
  if (
    !feature.properties ||
    !feature.properties.label ||
    !feature.properties.postcode
  )
    return;

  if (feature.properties.label.includes(feature.properties.postcode))
    return feature.properties.label;

  if (feature.properties.type === "municipality")
    return [feature.properties.postcode, feature.properties.name].join(" ");

  console.error("Unexpected API adresse feature", feature);
  return;
};
