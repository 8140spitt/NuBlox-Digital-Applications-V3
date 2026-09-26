import type { RequestHandler } from './$types';

const routes = [
  '/',
  '/product',
  '/product/platform',
  '/functions',
  '/industries',
  '/construction-built-environment',
  '/security',
  '/pricing',
  '/resources',
  '/company',
  '/contact',
  '/register',
  '/login'
];

export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map((path) => `  <url><loc>${origin}${path}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
};
