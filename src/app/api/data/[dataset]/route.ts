import { refreshLiveData } from '@/lib/data/metrics';
import { DATA_LICENCE, DATASET_ALIASES, DATASETS, toCsv } from '@/lib/data/datasets';
import { METHOD_VERSION, SITE_URL } from '@/lib/site';

// Open data export: /api/data/<dataset> (CSV) or /api/data/<dataset>?format=json.
export const revalidate = 3600;

export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params;
  if (dataset === 'generation-snapshots') {
    return new Response(
      'This dataset was withdrawn in October 2026: it was modelled, not published data. See /data for the current datasets.',
      { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
  const slug = DATASET_ALIASES[dataset] ?? dataset;
  const ds = DATASETS.find((d) => d.slug === slug);
  if (!ds) return new Response('Unknown dataset', { status: 404 });

  await refreshLiveData();
  const rows = ds.rows();
  const format = new URL(request.url).searchParams.get('format');
  const common = {
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
    Link: `<${DATA_LICENCE.url}>; rel="license"`,
  };

  if (format === 'json') {
    return Response.json(
      {
        dataset: ds.slug,
        title: ds.title,
        description: ds.description,
        basis: ds.basis,
        methodVersion: METHOD_VERSION,
        method: `${SITE_URL}/methodology`,
        licence: DATA_LICENCE,
        generatedAt: new Date().toISOString(),
        columns: ds.columns,
        rows,
      },
      { headers: common },
    );
  }

  return new Response(toCsv(rows, ds.columns), {
    headers: {
      ...common,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="irishgrid-${ds.slug}.csv"`,
    },
  });
}
