import { ConventionDto } from "shared/src/convention/convention.dto";
import { ImmersionAssessmentEmailParams } from "../../immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ConventionRawBeforeExportVO } from "../valueObjects/ConventionRawBeforeExportVO";

export interface ConventionQueries {
  getAllConventionsForExport: () => Promise<ConventionRawBeforeExportVO[]>;
  getLatestUpdated: () => Promise<ConventionDto[]>;
  getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ImmersionAssessmentEmailParams[]>;
}
