import register from '$lib/generated/business-object-register.json';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, params }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const family = url.searchParams.get('family') ?? '';
	const kind = url.searchParams.get('kind') ?? '';
	const review = url.searchParams.get('review') ?? '';
	const selectedKey = url.searchParams.get('object') ?? '';
	const duplicateNames = new Set(
		register.duplicates.map((item) => item.canonical_name.toLowerCase())
	);

	let filtered = register.objects.filter((object) => {
		if (family && object.family_id !== family) return false;
		if (kind && object.semantic_kind !== kind) return false;
		if (review === 'duplicates' && !duplicateNames.has(object.canonical_name.toLowerCase())) {
			return false;
		}
		if (!q) return true;
		const haystack = [
			object.candidate_key,
			object.canonical_name,
			object.family_id,
			object.family_name,
			object.semantic_kind
		]
			.join(' ')
			.toLowerCase();
		return haystack.includes(q.toLowerCase());
	});

	filtered = filtered.sort(
		(a, b) =>
			a.canonical_name.localeCompare(b.canonical_name) ||
			a.family_id.localeCompare(b.family_id) ||
			a.candidate_key.localeCompare(b.candidate_key)
	);

	const pageSize = 50;
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const page = Number.isFinite(requestedPage)
		? Math.min(Math.max(requestedPage, 1), pageCount)
		: 1;
	const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
	const selected =
		(selectedKey ? register.objects.find((object) => object.candidate_key === selectedKey) : null) ??
		rows[0] ??
		null;
	const duplicate = selected
		? register.duplicates.find(
				(item) => item.canonical_name.toLowerCase() === selected.canonical_name.toLowerCase()
			) ?? null
		: null;

	return {
		tenantSlug: params.tenant,
		summary: register.summary,
		families: register.families,
		semanticKinds: register.semanticKinds,
		filters: { q, family, kind, review },
		rows,
		resultCount: filtered.length,
		page,
		pageSize,
		pageCount,
		selected,
		duplicate
	};
};
