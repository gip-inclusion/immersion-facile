import { ImmersionAssessmentEmailParams } from "../../immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRawBeforeExportVO } from "../valueObjects/ImmersionApplicationRawBeforeExportVO";

export interface ImmersionApplicationQueries {
  getAllApplicationsForExport: () => Promise<
    ImmersionApplicationRawBeforeExportVO[]
  >;
  getLatestUpdated: () => Promise<ImmersionApplicationEntity[]>;
  getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ImmersionAssessmentEmailParams[]>;
}
