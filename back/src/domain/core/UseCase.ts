export type UseCase<T, R = void> = {
  execute(params: T): Promise<R>;
};
