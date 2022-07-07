import { ConventionDto } from "shared/src/convention/convention.dto";
import { ImmersionAssessmentEmailParams } from "../../immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ConventionRawBeforeExport } from "../useCases/ExportConventionsReport";

export interface ConventionQueries {
  getAllConventionsForExport: () => Promise<ConventionRawBeforeExport[]>;
  getLatestUpdated: () => Promise<ConventionDto[]>;
  getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ImmersionAssessmentEmailParams[]>;
}
