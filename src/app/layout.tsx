import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Phone - AI電話自動応答システム',
  description: '株式会社Centaurus - AI電話自動応答管理画面',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
