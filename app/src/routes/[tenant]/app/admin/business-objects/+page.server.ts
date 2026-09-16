import { fail, redirect } from '@sveltejs/kit';
import register from '$lib/generated/business-object-register.json';
import {
  getBusinessObjectReview,
  listBusinessObjectReviewEvents,
  listBusinessObjectReviews,
  reviewDecisions,
  saveBusinessObjectReview,
  type BusinessObjectReviewDecision
} from '$lib/server/business-object-review';
import type { Actions, PageServerLoad } from './$types';

const actor = 'Development User';

export const load: PageServerLoad = ({ url, params }) => {
  const q = (url.searchParams.get('q') ?? '').trim();
  const family = url.searchParams.get('family') ?? '';
  const kind = url.searchParams.get('kind') ?? '';
  const review = url.searchParams.get('review') ?? '';
  const selectedKey = url.searchParams.get('object') ?? '';
  const duplicateNames = new Set(register.duplicates.map((item) => item.canonical_name.toLowerCase()));
  const reviews = listBusinessObjectReviews();
  const reviewMap = new Map(reviews.map((item) => [item.candidateKey, item]));

  let filtered = register.objects.filter((object) => {
    const currentReview = reviewMap.get(object.candidate_key);
    if (family && object.family_id !== family) return false;
    if (kind && object.semantic_kind !== kind) return false;
    if (review === 'duplicates' && !duplicateNames.has(object.canonical_name.toLowerCase())) return false;
    if (review === 'reviewed' && !currentReview) return false;
    if (review === 'unreviewed' && currentReview) return false;
    if (!q) return true;
    return [object.candidate_key, object.canonical_name, object.family_id, object.family_name, object.semantic_kind]
      .join(' ')
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  filtered = filtered.sort((a, b) =>
    a.canonical_name.localeCompare(b.canonical_name) ||
    a.family_id.localeCompare(b.family_id) ||
    a.candidate_key.localeCompare(b.candidate_key)
  );

  const pageSize = 50;
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1;
  const pageObjects = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rows = pageObjects.map((object) => ({ ...object, review: reviewMap.get(object.candidate_key) ?? null }));
  const selected =
    (selectedKey ? register.objects.find((object) => object.candidate_key === selectedKey) : null) ??
    pageObjects[0] ?? null;
  const duplicate = selected
    ? register.duplicates.find((item) => item.canonical_name.toLowerCase() === selected.canonical_name.toLowerCase()) ?? null
    : null;
  const selectedReview = selected ? getBusinessObjectReview(selected.candidate_key) : null;
  const reviewEvents = selected ? listBusinessObjectReviewEvents(selected.candidate_key) : [];

  return {
    tenantSlug: params.tenant,
    summary: {
      ...register.summary,
      reviewed: reviews.length,
      unreviewed: register.objects.length - reviews.length
    },
    families: register.families,
    semanticKinds: register.semanticKinds,
    reviewDecisions,
    filters: { q, family, kind, review },
    rows,
    resultCount: filtered.length,
    page,
    pageSize,
    pageCount,
    selected,
    selectedReview,
    reviewEvents,
    duplicate,
    mergeTargets: register.objects
      .filter((object) => object.candidate_key !== selected?.candidate_key)
      .map((object) => ({ key: object.candidate_key, name: object.canonical_name, family: object.family_id }))
      .sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key))
  };
};

export const actions: Actions = {
  review: async ({ request, params }) => {
    const form = await request.formData();
    const candidateKey = String(form.get('candidateKey') ?? '').trim();
    const decision = String(form.get('decision') ?? '').trim() as BusinessObjectReviewDecision;
    const proposedCanonicalName = String(form.get('proposedCanonicalName') ?? '');
    const targetCandidateKey = String(form.get('targetCandidateKey') ?? '');
    const notes = String(form.get('notes') ?? '');
    const candidate = register.objects.find((object) => object.candidate_key === candidateKey);
    if (!candidate) return fail(400, { message: 'Candidate object not found.' });
    if (!reviewDecisions.includes(decision)) return fail(400, { message: 'Choose a valid review decision.' });
    if (decision === 'MERGE' && !register.objects.some((object) => object.candidate_key === targetCandidateKey.trim())) {
      return fail(400, { message: 'Choose a valid merge target.' });
    }

    try {
      saveBusinessObjectReview(candidateKey, { decision, proposedCanonicalName, targetCandidateKey, notes }, actor, params.tenant);
    } catch (error) {
      return fail(400, { message: error instanceof Error ? error.message : 'Unable to save review decision.' });
    }

    throw redirect(303, `/${params.tenant}/app/admin/business-objects?object=${encodeURIComponent(candidateKey)}`);
  }
};
