import {
  RomeCodeAppellationDto,
  RomeCodeMetierDto,
} from "../../../shared/rome";

export type RomeMetier = {
  codeMetier: RomeCodeMetierDto;
  libelle: string;
};

export type RomeAppellation = {
  libelle: string;
  codeAppellation: RomeCodeAppellationDto;
  codeMetier: RomeCodeMetierDto;
};

export interface RomeGateway {
  appellationToCodeMetier(
    romeCodeAppellation: RomeCodeAppellationDto,
  ): Promise<RomeCodeMetierDto | undefined>;
  searchMetier: (query: string) => Promise<RomeMetier[]>;
  searchAppellation: (query: string) => Promise<RomeAppellation[]>;
}
