import { getKusonimeDetails } from '@/lib/kusonimeScraper';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const data = await getKusonimeDetails(slug);
    if (!data) {
      return Response.json({ error: 'Anime not found on Kusonime or service disabled' }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
