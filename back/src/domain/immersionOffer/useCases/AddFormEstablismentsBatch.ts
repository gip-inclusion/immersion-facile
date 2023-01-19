import {
  AppJwtPayload,
  FormEstablishmentBatch,
  formEstablishmentBatchSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { AddFormEstablishment } from "./AddFormEstablishment";

export class AddFormEstablishmentBatch extends TransactionalUseCase<
  FormEstablishmentBatch,
  void,
  AppJwtPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    _addFormEstablishmentUsecase: AddFormEstablishment,
    //private createNewEvent: CreateNewEvent, // private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  protected inputSchema = formEstablishmentBatchSchema;

  protected _execute(
    _params: FormEstablishmentBatch,
    _uow: UnitOfWork,
    _jwtPayload: AppJwtPayload | undefined,
  ): Promise<void> {
    _params.formEstablishments[0];
    return Promise.resolve(undefined);
  }
}
