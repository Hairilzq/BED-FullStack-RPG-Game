// ⚠️ DO NOT MODIFY THIS FILE — it tests the project's error handling infrastructure.

import { vi } from 'vitest';
import { ERROR_CODES, AppError, errorHandler } from '../../src/utils/_errors.js';

describe('AppError', () => {
  it('creates an error with correct code, status, and message for a known code', () => {
    const err = new AppError('NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('uses custom details as the message when provided', () => {
    const err = new AppError('NOT_FOUND', 'Task 42 not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Task 42 not found');
  });

  it('defaults to INTERNAL_ERROR for an unknown code', () => {
    const err = new AppError('BOGUS_CODE');
    expect(err.code).toBe('BOGUS_CODE');
    expect(err.status).toBe(500);
    expect(err.message).toBe('Internal server error');
  });
});

describe('errorHandler', () => {
  let res;
  let next;

  beforeEach(() => {
    // Suppress console.error output during tests
    vi.spyOn(console, 'error').mockImplementation(() => { });

    res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns structured { error: { code, message, status } } for an AppError', () => {
    const err = new AppError('VALIDATION_ERROR', 'Title is required');
    errorHandler(err, {}, res, next);

    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Title is required',
        status: 400,
      },
    });
  });

  it('sets the correct HTTP status code on the response', () => {
    const err = new AppError('NOT_FOUND');
    errorHandler(err, {}, res, next);

    expect(res.statusCode).toBe(404);
  });

  it('returns INTERNAL_ERROR for a plain Error (unknown)', () => {
    const err = new Error('something broke');
    errorHandler(err, {}, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        status: 500,
      },
    });
  });
});
