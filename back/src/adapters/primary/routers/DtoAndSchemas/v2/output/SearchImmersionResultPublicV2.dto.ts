import {
  type AddressDto,
  type AppellationDto,
  type ContactMode,
  type GeoPositionDto,
  isInternalOfferDto,
  type LocationId,
  type OfferDto,
  type RomeCode,
  type SiretDto,
} from "shared";

export type SearchImmersionResultPublicV2 = {
  rome: RomeCode;
  romeLabel: string;
  appellations: AppellationDto[];
  establishmentScore: number;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMode;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
  locationId: LocationId | null;
};

export const domainToSearchImmersionResultPublicV2 = (
  searchImmersionResult: OfferDto,
): SearchImmersionResultPublicV2 => {
  if (isInternalOfferDto(searchImmersionResult)) {
    const {
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      fitForDisabledWorkers: _fitForDisabledWorkers,
      customizedName: _customizedName,
      remoteWorkMode: _remoteWorkMode,
      ...searchImmersionResultPublicV2Data
    } = searchImmersionResult;
    return searchImmersionResultPublicV2Data;
  }

  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    fitForDisabledWorkers: _fitForDisabledWorkers,
    customizedName: _customizedName,
    ...searchImmersionResultPublicV2Data
  } = searchImmersionResult;

  return searchImmersionResultPublicV2Data;
};
