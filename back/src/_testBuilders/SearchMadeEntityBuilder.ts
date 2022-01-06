import {
  SearchMadeEntity,
  SearchMadeId,
} from "../domain/immersionOffer/entities/SearchMadeEntity";
import { Builder } from "./Builder";

const validSearchMadeEntity: SearchMadeEntity = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  rome: "M1607",
  distance_km: 30,
  lat: 49.119146,
  lon: 6.17602,
};

export class SearchMadeEntityBuilder implements Builder<SearchMadeEntity> {
  constructor(
    private readonly entity: SearchMadeEntity = validSearchMadeEntity,
  ) {}

  public withId(id: SearchMadeId): SearchMadeEntityBuilder {
    return new SearchMadeEntityBuilder({
      ...this.entity,
      id,
    });
  }
  build() {
    return this.entity;
  }
}
