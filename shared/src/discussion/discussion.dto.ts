import type { discussionExchangeForbidenReasons } from "..";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto } from "../address/address.dto";
import type { ContactLevelOfEducation } from "../contactEstablishmentRequest/contactEstablishmentRequest.dto";
import type {
  ConventionId,
  discoverObjective,
  ImmersionObjective,
} from "../convention/convention.dto";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type { PhoneNumber } from "../phone/phone.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { ConnectedUserJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type {
  EmptyObject,
  ExtractFromExisting,
  OmitFromExistingKeys,
} from "../utils";
import type { DateString } from "../utils/date";
import type { exchangeRoles } from "./discussion.schema";

export const candidateWarnedMethods = [
  "phone",
  "email",
  "inPerson",
  "other",
] as const;

export type CandidateWarnedMethod = (typeof candidateWarnedMethods)[number];

export type ExchangeRole = (typeof exchangeRoles)[number];

export type DiscussionExchangeForbidenReason =
  (typeof discussionExchangeForbidenReasons)[number];

export type DiscussionExchangeForbiddenParams = {
  sender: ExchangeRole;
  reason: DiscussionExchangeForbidenReason;
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

export type DiscussionEmailParamsWithRecipientKind = OmitFromExistingKeys<
  DiscussionEmailParams,
  "rawRecipientKind" | "firstname" | "lastname"
> & {
  recipientKind: ExchangeRole;
  firstname?: string;
  lastname?: string;
};

export type WithDiscussionMessage = {
  message: string;
};

export type SendMessageToDiscussionFromDashboardRequestPayload = {
  discussionId: DiscussionId;
  jwt: ConnectedUserJwt;
} & ExchangeFromDashboard;

type WithContactByEmailProps<
  D extends DiscussionKind,
  C extends ContactMode,
> = C extends "EMAIL"
  ? {
      datePreferences: string;
      phone: PhoneNumber;
      immersionObjective: D extends "1_ELEVE_1_STAGE"
        ? Extract<ImmersionObjective, typeof discoverObjective>
        : ImmersionObjective | null;
    }
  : EmptyObject;

type WithContactByEmailAndIFProps<
  D extends DiscussionKind,
  C extends ContactMode,
> = D extends "IF"
  ? C extends "EMAIL"
    ? {
        // hasWorkingExperience
        // undefined uniquement pour la retro compat des anciennes discussions
        // non exploité dans le form
        hasWorkingExperience?: boolean;
        resumeLink?: string;
        experienceAdditionalInformation?: string;
      }
    : EmptyObject
  : EmptyObject;

type With1Eleve1StageProps<D extends DiscussionKind> =
  D extends "1_ELEVE_1_STAGE"
    ? {
        levelOfEducation: ContactLevelOfEducation;
      }
    : EmptyObject;

export type PotentialBeneficiaryCommonProps = {
  email: string;
  firstName: string;
  lastName: string;
};

export type DiscussionPotentialBeneficiary<
  D extends DiscussionKind,
  C extends ContactMode,
> = PotentialBeneficiaryCommonProps &
  WithContactByEmailProps<D, C> &
  WithContactByEmailAndIFProps<D, C> &
  With1Eleve1StageProps<D>;

export type DiscussionEstablishmentContact = {
  email: string;
  copyEmails: string[];
  firstName?: string;
  lastName?: string;
  phone: string;
  job: string;
};

export type CommonDiscussionDto = {
  address: AddressDto;
  businessName: string;
  conventionId?: ConventionId;
  createdAt: DateString;
  exchanges: Exchange[];
  id: DiscussionId;
  siret: SiretDto;
} & WithDiscussionStatus;

export type ExtraDiscussionDtoProperties = WithAcquisition & {
  appellationCode: AppellationCode;
  establishmentContact: DiscussionEstablishmentContact;
};

type SpecificDiscussionDto<C extends ContactMode, D extends DiscussionKind> = {
  contactMode: C;
  kind: D;
  potentialBeneficiary: DiscussionPotentialBeneficiary<D, C>;
};

type GenericDiscussionDto<
  D extends DiscussionKind,
  C extends ContactMode,
> = CommonDiscussionDto &
  ExtraDiscussionDtoProperties &
  SpecificDiscussionDto<C, D>;

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

export type DiscussionDto = DiscussionDtoIF | DiscussionDto1Eleve1Stage; // TODO: DiscussionDto = ContactEstablishmentRequestDto ? pourquoi conserver les deux ?

export type DiscussionDtoIF =
  | GenericDiscussionDto<"IF", "EMAIL">
  | GenericDiscussionDto<"IF", "IN_PERSON">
  | GenericDiscussionDto<"IF", "PHONE">;

export type DiscussionDto1Eleve1Stage =
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "EMAIL">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "IN_PERSON">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "PHONE">;

export type DiscussionDtoEmail =
  | GenericDiscussionDto<"IF", "EMAIL">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "EMAIL">;

export type DiscussionDtoPhone =
  | GenericDiscussionDto<"IF", "PHONE">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "PHONE">;

export type DiscussionDtoInPerson =
  | GenericDiscussionDto<"IF", "IN_PERSON">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "IN_PERSON">;

export type GenericDiscussionReadDto<
  D extends DiscussionKind,
  C extends ContactMode,
> = CommonDiscussionDto &
  SpecificDiscussionDto<C, D> & {
    appellation: AppellationAndRomeDto;
    establishmentContact: OmitFromExistingKeys<
      DiscussionEstablishmentContact,
      "email" | "copyEmails" | "phone"
    >;
  };

export type DiscussionReadDto =
  | GenericDiscussionReadDto<"IF", "EMAIL">
  | GenericDiscussionReadDto<"IF", "IN_PERSON">
  | GenericDiscussionReadDto<"IF", "PHONE">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "EMAIL">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "IN_PERSON">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "PHONE">;

export type Attachment = {
  name: string;
  link: string;
};

export type Exchange = {
  subject: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: DateString;
  attachments: Attachment[];
};

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
