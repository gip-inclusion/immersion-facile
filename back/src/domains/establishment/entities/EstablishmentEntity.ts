import {
  ContactMethod,
  DateTimeIsoString,
  EstablishmentSearchableBy,
  FormEstablishmentSource,
  Location,
  NafDto,
  NumberEmployeesRange,
  SiretDto,
  WithAcquisition,
} from "shared";

type ApiSource = "api_labonneboite";
type SourceProvider = FormEstablishmentSource | ApiSource;

export type EstablishmentEntity = {
  additionalInformation?: string;
  createdAt: Date;
  customizedName?: string;
  fitForDisabledWorkers: boolean;
  isCommited?: boolean;
  isOpen: boolean;
  isMaxDiscussionsForPeriodReached: boolean;
  lastInseeCheckDate?: Date;
  locations: Location[];
  maxContactsPerMonth: number;
  nafDto: NafDto;
  name: string;
  nextAvailabilityDate?: DateTimeIsoString;
  numberEmployeesRange: NumberEmployeesRange;
  searchableBy: EstablishmentSearchableBy;
  siret: SiretDto;
  sourceProvider: SourceProvider;
  updatedAt: Date;
  voluntaryToImmersion: boolean;
  website?: string;
  score: number;
  contactMethod: ContactMethod;
} & WithAcquisition;
