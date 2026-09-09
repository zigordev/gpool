import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { internalProblem, problemFromException, problemTypeFor } from './problem-details';

describe('problemFromException', () => {
  it('carries the code and params a throw supplies', () => {
    const problem = problemFromException(
      new NotFoundException({
        code: 'POOL.NOT_FOUND',
        message: 'Pool 7f3a not found',
        params: { poolId: '7f3a' },
      }),
      '/pools/7f3a'
    );

    expect(problem).toEqual({
      type: 'https://zigordev.com/problems/pool-not-found',
      title: 'Not found',
      status: 404,
      detail: 'Pool 7f3a not found',
      instance: '/pools/7f3a',
      code: 'POOL.NOT_FOUND',
      params: { poolId: '7f3a' },
    });
  });

  it('derives a code from the status when the throw is a bare string', () => {
    const problem = problemFromException(
      new ForbiddenException('Only administrators can create pools'),
      '/pools'
    );

    expect(problem.code).toBe('HTTP.FORBIDDEN');
    expect(problem.detail).toBe('Only administrators can create pools');
    expect(problem.type).toBe('https://zigordev.com/problems/http-forbidden');
  });

  it('joins the array a validation failure produces under one code', () => {
    const problem = problemFromException(
      new BadRequestException({
        statusCode: 400,
        message: ['name should not be empty', 'size must be a number'],
        error: 'Bad Request',
      }),
      '/pools'
    );

    expect(problem.code).toBe('VALIDATION.FAILED');
    expect(problem.detail).toBe('name should not be empty; size must be a number');
  });

  it('says nothing about why a 5xx happened', () => {
    const problem = problemFromException(
      new InternalServerErrorException('relation "pool" does not exist'),
      '/pools'
    );

    expect(problem.detail).toBeUndefined();
    expect(problem.params).toBeUndefined();
    expect(problem.status).toBe(500);
  });

  it('keeps a status that has no table entry', () => {
    const problem = problemFromException(
      new HttpException('teapot', HttpStatus.I_AM_A_TEAPOT),
      '/pools'
    );

    expect(problem.status).toBe(418);
    expect(problem.title).toBe('Error');
    expect(problem.code).toBe('HTTP.ERROR');
  });
});

describe('internalProblem', () => {
  it('describes a non-HttpException without leaking it', () => {
    expect(internalProblem('/pools')).toEqual({
      type: problemTypeFor('HTTP.INTERNAL_ERROR'),
      title: 'Internal server error',
      status: 500,
      instance: '/pools',
      code: 'HTTP.INTERNAL_ERROR',
    });
  });
});
