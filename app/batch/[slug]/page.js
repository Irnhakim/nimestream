async function getBatchDetails(slug) {
  try {
    const res = await fetch(`http://localhost:3000/api/batch/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get batch details:', e);
    return null;
  }
}

export default async function BatchDownloadPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const batch = await getBatchDetails(slug);

  if (!batch) {
    return (
      <main>
        <p style={{ textAlign: 'center', margin: '5rem 0', color: 'var(--text-muted)' }}>
          Link download batch tidak ditemukan atau gagal memuat data.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="detail-title" style={{ marginBottom: '1rem' }}>{batch.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Gunakan mirror links di bawah ini untuk mendownload seluruh episode sekaligus (batch).
        </p>

        {batch.downloads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Tautan download tidak tersedia.</p>
        ) : (
          <div className="download-box" style={{ marginTop: 0 }}>
            <h3 className="section-title">Download Links</h3>
            {batch.downloads.map((dl, idx) => (
              <div key={idx} className="download-row">
                <span className="download-quality">{dl.quality}</span>
                <div className="download-links">
                  {dl.links.map((link, j) => (
                    <a
                      key={j}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      {link.server}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
