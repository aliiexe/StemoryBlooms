export class CommerceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'INVALID_ORDER', status = 400) {
    super(message);
    this.name = 'CommerceError';
    this.code = code;
    this.status = status;
  }
}

export function publicError(error: unknown) {
  return error instanceof CommerceError
    ? { message: error.message, code: error.code, status: error.status }
    : { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR', status: 500 };
}
