export const runPromisesSequentially = async <T>(
  tasks: Array<Promise<T> | (() => Promise<T>)>,
): Promise<T[]> => {
  const results: T[] = [];
  for (const task of tasks) {
    const promise = typeof task === "function" ? task() : task;
    results.push(await promise);
  }
  return results;
};
