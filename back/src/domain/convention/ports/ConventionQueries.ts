import {
  ConventionId,
  ConventionReadDto,
  ListConventionsRequestDto,
} from "shared/src/convention/convention.dto";
import { ImmersionAssessmentEmailParams } from "../../immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ConventionRawBeforeExport } from "../useCases/ExportConventionsReport";

export interface ConventionQueries {
  getAllConventionsForExport: () => Promise<ConventionRawBeforeExport[]>;
  getLatestConventions: (
    requestDto: ListConventionsRequestDto,
  ) => Promise<ConventionReadDto[]>;
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ImmersionAssessmentEmailParams[]>;
}
