import { describe, expect, it } from 'vitest';
import {
  standardsChallengeRegister,
  standardsChallengeSummary,
  validateStandardsChallengeRegister
} from './standards-challenge-register';

describe('standards and interoperability challenge', () => {
  it('challenges the complete mandatory standards/reference set', () => {
    expect(validateStandardsChallengeRegister()).toBe(true);
    expect(standardsChallengeSummary.standardCount).toBe(12);
    expect(standardsChallengeSummary.challengedCount).toBe(12);
    expect(standardsChallengeSummary.openCount).toBe(0);
  });

  it('keeps openBIM exchange formats at the interoperability boundary', () => {
    for (const id of ['BUILDINGSMART-IFC', 'BUILDINGSMART-BCF', 'BUILDINGSMART-IDS']) {
      expect(standardsChallengeRegister.find((entry) => entry.id === id)?.decision).toBe(
        'interoperability-boundary'
      );
    }
  });

  it('keeps Uniclass as reference classification rather than object identity', () => {
    expect(standardsChallengeRegister.find((entry) => entry.id === 'UNICLASS')?.decision).toBe(
      'reference-data-boundary'
    );
  });

  it('does not create duplicate management-system masters for ISO standards', () => {
    for (const id of [
      'ISO-55001',
      'ISO-9001',
      'ISO-45001',
      'ISO-14001',
      'ISO-IEC-27001',
      'ISO-31000',
      'ISO-22301'
    ]) {
      expect(standardsChallengeRegister.find((entry) => entry.id === id)?.decision).toBe(
        'covered-existing-semantics'
      );
    }
  });
});
