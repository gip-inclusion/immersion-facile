import { values } from "ramda";
import { GroupSlug, SearchResultDto, SiretDto } from "shared";
import { GroupEntity } from "../../../domain/offer/entities/GroupEntity";
import { GroupRepository } from "../../../domain/offer/ports/GroupRepository";

export const stubSearchResult: SearchResultDto = {
  rome: "D1101",
  siret: "11112222111122",
  distance_m: 0,
  name: "Company inside repository",
  website: "www.jobs.fr",
  additionalInformation: "",
  voluntaryToImmersion: true,
  position: { lon: 50, lat: 35 },
  romeLabel: "Boucherie",
  appellations: [
    { appellationLabel: "Boucher / Bouchère", appellationCode: "11564" },
  ],
  naf: "7820Z",
  nafLabel: "Activités des agences de travail temporaire",
  address: {
    streetNumberAndAddress: "30 avenue des champs Elysées",
    postcode: "75017",
    city: "Paris",
    departmentCode: "75",
  },
  contactMode: "EMAIL",
  numberOfEmployeeRange: "10-19",
};

/* eslint-disable @typescript-eslint/require-await */
export class InMemoryGroupRepository implements GroupRepository {
  // for test purpose
  #groupsBySlug: Record<GroupSlug, GroupEntity> = {};

  public async findSearchResultsBySlug(): Promise<SearchResultDto[]> {
    return [stubSearchResult];
  }

  public async groupsWithSiret(siret: SiretDto): Promise<GroupEntity[]> {
    return values(this.#groupsBySlug).reduce<GroupEntity[]>(
      (acc, group) => [
        ...acc,
        ...(group.sirets.includes(siret) ? [group] : []),
      ],
      [],
    );
  }

  public async save(group: GroupEntity) {
    this.#groupsBySlug[group.slug] = group;
  }

  public get groups(): GroupEntity[] {
    return Object.values(this.#groupsBySlug);
  }

  public set groups(groups: GroupEntity[]) {
    this.#groupsBySlug = groups.reduce(
      (acc, group) => ({ ...acc, [group.slug]: group }),
      {} satisfies Record<GroupSlug, GroupEntity>,
    );
  }
}

/* eslint-enable @typescript-eslint/require-await */
