import { getLatestKusonime } from '@/lib/kusonimeScraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  try {
    const data = await getLatestKusonime(parseInt(page, 10));
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
