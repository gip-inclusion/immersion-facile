import { values } from "ramda";
import { EstablishmentGroupSlug, SearchResultDto, SiretDto } from "shared";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

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
export class InMemoryEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  // for test purpose
  #groupsBySlug: Record<EstablishmentGroupSlug, EstablishmentGroupEntity> = {};

  public async findSearchImmersionResultsBySlug(): Promise<SearchResultDto[]> {
    return [stubSearchResult];
  }

  public async groupsWithSiret(
    siret: SiretDto,
  ): Promise<EstablishmentGroupEntity[]> {
    return values(this.#groupsBySlug).reduce<EstablishmentGroupEntity[]>(
      (acc, group) => [
        ...acc,
        ...(group.sirets.includes(siret) ? [group] : []),
      ],
      [],
    );
  }

  public async save(group: EstablishmentGroupEntity) {
    this.#groupsBySlug[group.slug] = group;
  }

  public get groups(): EstablishmentGroupEntity[] {
    return Object.values(this.#groupsBySlug);
  }

  public set groups(groups: EstablishmentGroupEntity[]) {
    this.#groupsBySlug = groups.reduce(
      (acc, group) => ({ ...acc, [group.slug]: group }),
      {} satisfies Record<EstablishmentGroupSlug, EstablishmentGroupEntity>,
    );
  }
}

/* eslint-enable @typescript-eslint/require-await */
