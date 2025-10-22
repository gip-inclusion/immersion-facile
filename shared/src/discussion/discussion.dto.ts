import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto, LocationId } from "../address/address.dto";
import type { BusinessName } from "../business/business";
import type {
  ConventionId,
  discoverObjective,
  ImmersionObjective,
  LevelOfEducation,
} from "../convention/convention.dto";
import type { Email } from "../email/email.dto";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type { PhoneNumber } from "../phone/phone.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { ConnectedUserJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type { ExtractFromExisting, OmitFromExistingKeys } from "../utils";
import type { DateString } from "../utils/date";
import type {
  discussionExchangeForbidenReasons,
  exchangeRoles,
} from "./discussion.schema";

export const candidateWarnedMethods = [
  "phone",
  "email",
  "inPerson",
  "other",
] as const;

export type CandidateWarnedMethod = (typeof candidateWarnedMethods)[number];

export type ExchangeRole = (typeof exchangeRoles)[number];

export type DiscussionExchangeForbiddenReason =
  (typeof discussionExchangeForbidenReasons)[number];

export type DiscussionExchangeForbiddenParams = {
  sender: ExchangeRole;
  reason: DiscussionExchangeForbiddenReason;
};

export type DiscussionId = Flavor<string, "DiscussionId">;
export type WithDiscussionId = {
  discussionId: DiscussionId;
};

export type DiscussionKind = "IF" | "1_ELEVE_1_STAGE";

export type LegacyDiscussionEmailParams = {
  discussionId: DiscussionId;
  rawRecipientKind: string;
};

export type DiscussionEmailParams = LegacyDiscussionEmailParams & {
  firstname: string;
  lastname: string;
};

export type WithDiscussionMessage = {
  message: string;
};

export type SendMessageToDiscussionFromDashboardRequestPayload = {
  discussionId: DiscussionId;
  jwt: ConnectedUserJwt;
} & ExchangeFromDashboard;

export const contactLevelsOfEducation = [
  "3ème",
  "2nde",
] as const satisfies Extract<LevelOfEducation, "3ème" | "2nde">[];

export type ContactLevelOfEducation = (typeof contactLevelsOfEducation)[number];

export const labelsForContactLevelOfEducation: Record<
  ContactLevelOfEducation,
  string
> = {
  "3ème": "Troisième",
  "2nde": "Seconde",
};

type ContactInformations<D extends DiscussionKind> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: ContactMode;
  kind: D;
  locationId: LocationId;
} & WithAcquisition &
  (D extends "1_ELEVE_1_STAGE"
    ? { levelOfEducation: ContactLevelOfEducation }
    : // biome-ignore lint/complexity/noBannedTypes: we need {} here
      {});

type CreateDiscussionDtoCommon = {
  potentialBeneficiaryPhone: string;
  datePreferences: string;
};

export type CreateDiscussionIFDto = ContactInformations<"IF"> &
  CreateDiscussionDtoCommon & {
    immersionObjective: ImmersionObjective;
    experienceAdditionalInformation?: string;
    potentialBeneficiaryResumeLink?: string;
  };

export type CreateDiscussion1Eleve1StageDto =
  ContactInformations<"1_ELEVE_1_STAGE"> &
    CreateDiscussionDtoCommon & {
      immersionObjective: Extract<ImmersionObjective, typeof discoverObjective>;
    };

export type CreateDiscussionDto =
  | CreateDiscussionIFDto
  | CreateDiscussion1Eleve1StageDto;

export type ContactEstablishmentEventPayload = {
  discussionId: DiscussionId;
  siret: SiretDto;
  isLegacy?: boolean;
};

type WithDiscussionKindProps<D extends DiscussionKind> = D extends "IF"
  ? {
      resumeLink?: string;
      experienceAdditionalInformation?: string;
      immersionObjective: ImmersionObjective | null;
    }
  : {
      levelOfEducation: ContactLevelOfEducation;
      immersionObjective: Extract<ImmersionObjective, typeof discoverObjective>;
    };

export type PotentialBeneficiaryCommonProps = {
  email: string;
  firstName: string;
  lastName: string;
  datePreferences: string;
  phone: PhoneNumber;
};

type DiscussionPotentialBeneficiary<D extends DiscussionKind> =
  PotentialBeneficiaryCommonProps & WithDiscussionKindProps<D>;

export type CommonDiscussionDto = {
  address: AddressDto;
  businessName: BusinessName;
  conventionId?: ConventionId;
  createdAt: DateString;
  updatedAt: DateString;
  id: DiscussionId;
  siret: SiretDto;
} & WithDiscussionStatus;

export type ExtraDiscussionDtoProperties = WithAcquisition & {
  appellationCode: AppellationCode;
  exchanges: Exchange[];
};

type SpecificDiscussionDto<D extends DiscussionKind> = {
  contactMode: ContactMode;
  kind: D;
  potentialBeneficiary: DiscussionPotentialBeneficiary<D>;
};

type GenericDiscussionDto<D extends DiscussionKind> = CommonDiscussionDto &
  ExtraDiscussionDtoProperties &
  SpecificDiscussionDto<D>;

export type DiscussionStatus = DiscussionDto["status"];
export type RejectionKind = WithDiscussionStatusRejected["rejectionKind"];

export type WithDiscussionStatus =
  | WithDiscussionStatusAccepted
  | WithDiscussionStatusRejected
  | WithDiscussionStatusPending;

export type WithDiscussionStatusAccepted = {
  status: "ACCEPTED";
  candidateWarnedMethod: CandidateWarnedMethod | null;
  conventionId?: ConventionId;
};

export type WithDiscussionStatusRejected = {
  status: "REJECTED";
} & WithDiscussionRejection;

export type WithDiscussionStatusPending = {
  status: "PENDING";
};

export const discussionStatuses: DiscussionStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "PENDING",
];

export type WithDiscussionRejection =
  | RejectionWithoutReason
  | RejectionWithReason
  | RejectionCandidateAlreadyWarned;

type RejectionWithoutReason = {
  rejectionKind: "UNABLE_TO_HELP" | "NO_TIME" | "DEPRECATED";
};

type RejectionWithReason = {
  rejectionKind: "OTHER";
  rejectionReason: string;
};

export type RejectionCandidateAlreadyWarned = {
  rejectionKind: "CANDIDATE_ALREADY_WARNED";
  candidateWarnedMethod: CandidateWarnedMethod;
};

export type UpdateDiscussionStatusParams = WithDiscussionId &
  WithDiscussionStatus;

export type WithDiscussionDto = {
  discussion: DiscussionDto;
};

export type DiscussionDto = DiscussionDtoIF | DiscussionDto1Eleve1Stage;

export type DiscussionDtoIF = GenericDiscussionDto<"IF">;
export type DiscussionDto1Eleve1Stage = GenericDiscussionDto<"1_ELEVE_1_STAGE">;

export type GenericDiscussionReadDto<D extends DiscussionKind> =
  CommonDiscussionDto &
    SpecificDiscussionDto<D> & {
      appellation: AppellationAndRomeDto;
      exchanges: ExchangeRead[];
    };

export type DiscussionReadDto =
  | GenericDiscussionReadDto<"IF">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE">;

export type Attachment = {
  name: string;
  link: string;
};

type CommonExchange = {
  subject: string;
  message: string;
  sentAt: DateString;
  attachments: Attachment[];
};

export type SpecificExchangeSender<S extends ExchangeRole> =
  S extends "establishment"
    ? {
        sender: S;
        firstname: string;
        lastname: string;
        email: Email;
      }
    : {
        sender: S;
      };

export type EstablishmentExchange = CommonExchange &
  SpecificExchangeSender<"establishment">;
export type PotentialBeneficiaryExchange = CommonExchange &
  SpecificExchangeSender<"potentialBeneficiary">;

export type Exchange = EstablishmentExchange | PotentialBeneficiaryExchange;

export type ExchangeRead = CommonExchange &
  (
    | SpecificExchangeSender<"potentialBeneficiary">
    | OmitFromExistingKeys<SpecificExchangeSender<"establishment">, "email">
  );

export type ExchangeMessageFromDashboard = Pick<Exchange, "message">;

export type ExchangeFromDashboard = ExchangeMessageFromDashboard &
  WithDiscussionId;

export type DiscussionDisplayStatus =
  | "accepted"
  | "rejected"
  | "new"
  | "needs-answer"
  | "needs-urgent-answer"
  | "answered";

export type DiscussionInList = Pick<
  DiscussionReadDto,
  | "id"
  | "appellation"
  | "businessName"
  | "createdAt"
  | "siret"
  | "kind"
  | "exchanges"
  | "status"
> & {
  potentialBeneficiary: {
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  immersionObjective: ImmersionObjective | null;
  city: string;
};

export type DiscussionOrderKey = ExtractFromExisting<
  keyof DiscussionInList,
  "createdAt"
>;

export type DiscussionOrderDirection = "asc" | "desc";

export type FlatGetPaginatedDiscussionsParams = {
  // pagination
  page?: number;
  perPage?: number;

  // sort
  orderBy?: DiscussionOrderKey;
  orderDirection?: DiscussionOrderDirection;

  // filters
  statuses?: DiscussionStatus | DiscussionStatus[];
  search?: string;
};
