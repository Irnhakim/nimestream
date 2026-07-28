import { searchKusonime } from '@/lib/kusonimeScraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return Response.json([]);
  }

  try {
    const data = await searchKusonime(query);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
