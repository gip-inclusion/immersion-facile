import { SearchImmersionResultDto } from "shared";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export const stubSearchResult: SearchImmersionResultDto = {
  rome: "D1101",
  siret: "11112222111122",
  distance_m: 0,
  name: "Company inside repository",
  website: "www.jobs.fr",
  additionalInformation: "",
  voluntaryToImmersion: true,
  position: { lon: 50, lat: 35 },
  romeLabel: "Boucherie",
  appellationLabels: ["Boucher / Bouchère"],
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
  public async save(group: EstablishmentGroupEntity) {
    this.groupsByName[group.name] = group;
  }

  public async findSearchImmersionResultsBySlug(): Promise<
    SearchImmersionResultDto[]
  > {
    return [stubSearchResult];
  }

  // for test purpose
  private groupsByName: Record<string, EstablishmentGroupEntity> = {};

  public set groups(groups: EstablishmentGroupEntity[]) {
    this.groupsByName = groups.reduce(
      (acc, group) => ({ ...acc, [group.name]: group }),
      {} as Record<string, EstablishmentGroupEntity>,
    );
  }

  public get groups(): EstablishmentGroupEntity[] {
    return Object.values(this.groupsByName);
  }
}

/* eslint-enable @typescript-eslint/require-await */
