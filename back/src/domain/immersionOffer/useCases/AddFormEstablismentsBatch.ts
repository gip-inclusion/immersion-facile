import {
  AppJwtPayload,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  formEstablishmentBatchSchema,
  splitInChunks,
} from "shared";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UseCase } from "../../core/UseCase";
import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";
import { AddFormEstablishment } from "./AddFormEstablishment";

const slugify = (str: string) =>
  str
    .trim()
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/\W/g, "-");

export class AddFormEstablishmentBatch extends UseCase<
  FormEstablishmentBatchDto,
  EstablishmentBatchReport,
  AppJwtPayload
> {
  constructor(
    private addFormEstablishmentUseCase: AddFormEstablishment,
    private uowPerformer: UnitOfWorkPerformer,
  ) {
    super();
  }

  protected inputSchema = formEstablishmentBatchSchema;

  protected async _execute({
    formEstablishments,
    groupName,
  }: FormEstablishmentBatchDto): Promise<EstablishmentBatchReport> {
    const group: EstablishmentGroupEntity = {
      slug: slugify(groupName),
      name: groupName,
      sirets: formEstablishments.map(({ siret }) => siret),
    };
    await this.uowPerformer.perform((uow) =>
      uow.establishmentGroupRepository.save(group),
    );

    const sizeOfChunk = 15;
    const chunksOfFormEstablishments = splitInChunks(
      formEstablishments,
      sizeOfChunk,
    );

    const report: EstablishmentBatchReport = {
      numberOfEstablishmentsProcessed: 0,
      numberOfSuccess: 0,
      failures: [],
    };

    for (let i = 0; i < chunksOfFormEstablishments.length; i++) {
      const chunkOfFormEstablishments = chunksOfFormEstablishments[i];
      await Promise.all(
        chunkOfFormEstablishments.map(async (formEstablishment) => {
          try {
            await this.addFormEstablishmentUseCase.execute(formEstablishment);
            report.numberOfSuccess += 1;
          } catch (error: any) {
            report.failures.push({
              siret: formEstablishment.siret,
              errorMessage: error?.message,
            });
          } finally {
            report.numberOfEstablishmentsProcessed += 1;
          }
        }),
      );
    }

    return report;
  }
}
