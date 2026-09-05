export class AppError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public technicalMessage?: string
  ) {
    super(userMessage);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found.`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export function handleError(error: unknown): { status: number; body: { success: false; error: string } } {
  if (error instanceof AppError) {
    console.error(`[${error.name}] ${error.technicalMessage || error.userMessage}`);
    return {
      status: error.statusCode,
      body: { success: false, error: error.userMessage },
    };
  }

  console.error('[UnexpectedError]', error);
  return {
    status: 500,
    body: { success: false, error: 'An unexpected error occurred. Please try again.' },
  };
}
