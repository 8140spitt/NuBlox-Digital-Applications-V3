export class KernelInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KernelInvariantError';
  }
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new KernelInvariantError(message);
  }
}
