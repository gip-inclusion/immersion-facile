import {
  type AgencyId,
  type AssessmentDto,
  agencyIdSchema,
  assessmentDtoSchema,
  type ConventionReadDto,
  conventionReadSchema,
  emailSchema,
  type SubscriberErrorFeedback,
} from "shared";
import z from "zod";
import type { AccessTokenResponse } from "../../../config/bootstrap/appConfig";

// This is an interface contract with France Travail (conventions broadcast).
// ! Beware of NOT breaking contract ! !
// Doc is here : https://pad.incubateur.net/6p38o0mNRfmc8WuJ77Xr0w?view

type FranceTravailBroadcastSuccessResponse = {
  status: 200 | 201 | 204;
  body: unknown;
};
type FranceTravailBroadcastErrorResponse = {
  status: Exclude<number, 200 | 201>;
  subscriberErrorFeedback: SubscriberErrorFeedback;
  body: unknown;
};

export type FranceTravailBroadcastResponse =
  | FranceTravailBroadcastSuccessResponse
  | FranceTravailBroadcastErrorResponse;

export type NotifyFranceTravailOnConventionUpdatedParams =
  | {
      eventType: "CONVENTION_UPDATED";
      convention: FranceTravailConventionReadDto;
      previousAgencyId?: AgencyId;
      assessment?: AssessmentDto;
    }
  | {
      eventType: "ASSESSMENT_CREATED";
      convention: FranceTravailConventionReadDto;
      assessment: AssessmentDto;
    };

export interface FranceTravailGateway {
  notifyOnConventionUpdated: (
    params: NotifyFranceTravailOnConventionUpdatedParams,
  ) => Promise<FranceTravailBroadcastResponse>;

  getAccessToken: (scope: string) => Promise<AccessTokenResponse>;
}

export type FranceTravailConventionReadDto = ConventionReadDto & {
  agencyValidatorEmails: string[];
};

const franceTravailConventionReadDtoSchema: z.ZodType<FranceTravailConventionReadDto> =
  conventionReadSchema.and(
    z.object({ agencyValidatorEmails: z.array(emailSchema) }),
  );

export const notifyFranceTravailOnConventionUpdatedParamsSchema: z.ZodType<NotifyFranceTravailOnConventionUpdatedParams> =
  z.union([
    z.object({
      eventType: z.literal("CONVENTION_UPDATED"),
      convention: franceTravailConventionReadDtoSchema,
      previousAgencyId: agencyIdSchema.optional(),
      assessment: assessmentDtoSchema.optional(),
    }),
    z.object({
      eventType: z.literal("ASSESSMENT_CREATED"),
      convention: franceTravailConventionReadDtoSchema,
      assessment: assessmentDtoSchema,
    }),
  ]);

export const isBroadcastSuccessResponse = (
  response: FranceTravailBroadcastResponse,
): response is FranceTravailBroadcastSuccessResponse =>
  [200, 201, 204].includes(response.status);
