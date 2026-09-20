import { describe, expect, it } from 'vitest';
import {
  constructionJobCatalogue,
  deliveryDomainCatalogue,
  enterpriseFunctionalCatalogue,
  functionalCatalogue,
  functionalCatalogueCounts
} from './functional-deployment-catalogue';

describe('functional governance, delivery and deployment catalogue', () => {
  it('contains the governed NuBlox baseline of 29 enterprise functions, 16 delivery domains and 84 jobs', () => {
    expect(enterpriseFunctionalCatalogue).toHaveLength(29);
    expect(deliveryDomainCatalogue).toHaveLength(16);
    expect(constructionJobCatalogue).toHaveLength(84);
    expect(functionalCatalogueCounts).toEqual({
      enterpriseFunctions: 29,
      deliveryDomains: 16,
      constructionJobs: 84
    });
  });

  it('uses unique stable function/domain and job codes', () => {
    expect(new Set(functionalCatalogue.map((item) => item.code)).size).toBe(
      functionalCatalogue.length
    );
    expect(new Set(constructionJobCatalogue.map((item) => item.code)).size).toBe(
      constructionJobCatalogue.length
    );
  });

  it('maps every construction job to a governed delivery domain', () => {
    const domains = new Set(deliveryDomainCatalogue.map((item) => item.name));
    for (const job of constructionJobCatalogue) {
      expect(domains.has(job.sectorDomain)).toBe(true);
      expect(job.name.trim().length).toBeGreaterThan(0);
      expect(job.specialistCapabilityFocus.trim().length).toBeGreaterThan(0);
    }
  });

  it('retains the identified Architect, Quantity surveyor and Construction manager job profiles', () => {
    const names = new Set(constructionJobCatalogue.map((item) => item.name));
    expect(names.has('Architect')).toBe(true);
    expect(names.has('Quantity surveyor')).toBe(true);
    expect(names.has('Construction manager')).toBe(true);
  });
});
