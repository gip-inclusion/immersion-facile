const getAgenciesUseCase = (action$, _state$, { agencyGateway }) =>
  action$.pipe(
    switchMap(() => agencyGateway.listAgencies("01")),
    map(agenciesSlice.actions.fetchAgenciesSucceeded),
  );

export const agenciesEpics = [getAgenciesUseCase];
