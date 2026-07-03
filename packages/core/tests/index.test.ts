import { describe, expect, it } from 'vitest';
import { CORE_NAME } from '../src/index';

describe('core wiring', () => {
  it('exports the package name', () => {
    expect(CORE_NAME).toBe('omahi-core');
  });
});
