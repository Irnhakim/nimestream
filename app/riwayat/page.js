import RiwayatPageClient from './RiwayatPageClient';

export const metadata = {
  title: 'Riwayat Tontonan | NimeStream',
  description: 'Riwayat tontonan anime Anda di NimeStream. Disimpan secara lokal di perangkat Anda.',
  robots: {
    index: false,
    follow: false
  }
};

export default function RiwayatPage() {
  return (
    <main>
      <RiwayatPageClient />
    </main>
  );
}
