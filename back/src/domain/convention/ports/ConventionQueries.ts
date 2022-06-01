import { ImmersionAssessmentEmailParams } from "../../immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ConventionEntity } from "../entities/ConventionEntity";
import { ConventionRawBeforeExportVO } from "../valueObjects/ConventionRawBeforeExportVO";

export interface ConventionQueries {
  getAllConventionsForExport: () => Promise<ConventionRawBeforeExportVO[]>;
  getLatestUpdated: () => Promise<ConventionEntity[]>;
  getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ImmersionAssessmentEmailParams[]>;
}
