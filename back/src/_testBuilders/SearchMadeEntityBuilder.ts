import { Builder } from "shared";
import {
  SearchMadeEntity,
  SearchMadeId,
} from "../domain/offer/entities/SearchMadeEntity";

const validSearchMadeEntity: SearchMadeEntity = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  distanceKm: 30,
  lat: 49.119146,
  lon: 6.17602,
  needsToBeSearched: false,
  sortedBy: "distance",
};

export class SearchMadeEntityBuilder implements Builder<SearchMadeEntity> {
  constructor(
    private readonly entity: SearchMadeEntity = validSearchMadeEntity,
  ) {}

  build(): SearchMadeEntity {
    return this.entity;
  }

  public withId(id: SearchMadeId): SearchMadeEntityBuilder {
    return new SearchMadeEntityBuilder({
      ...this.entity,
      id,
    });
  }

  public withNeedsToBeSearch() {
    return new SearchMadeEntityBuilder({
      ...this.entity,
      needsToBeSearched: true,
    });
  }
}
