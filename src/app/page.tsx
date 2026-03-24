export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          📞 AI Phone
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          AI電話自動応答システム - 株式会社Centaurus
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto">
          <p className="text-slate-700 mb-4">
            Twilio Webhook: <code className="bg-slate-100 px-2 py-1 rounded text-sm">/api/twilio/voice</code>
          </p>
          <p className="text-slate-500 text-sm">
            管理画面は今後実装予定
          </p>
        </div>
      </div>
    </main>
  );
}
