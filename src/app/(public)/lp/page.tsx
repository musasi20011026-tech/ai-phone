import { Phone, Clock, FileText, Bell, Shield, Zap, ChevronRight, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">AI Phone</span>
          </div>
          <a href="#beta" className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition">
            βテストに参加
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" /> βテスト参加者募集中
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
            電話対応を<span className="text-indigo-600">AIに任せる</span>、<br />
            新しい時代へ。
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            営業時間外も、忙しい時間帯も、AIが自然な日本語で電話対応。
            予約受付から問い合わせ対応まで、24時間365日。
            翌朝、管理画面を開くだけ。
          </p>
          <a href="#beta" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            無料でβテストに参加する <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">こんなお悩みありませんか？</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: '電話に出られない', desc: '忙しい時間帯や営業時間外の電話を取りこぼしている' },
              { title: '予約の機会損失', desc: '電話に出られなかった1件が、そのまま競合に流れている' },
              { title: '電話番の人件費', desc: 'パート・アルバイトの電話番に月15〜20万円かかっている' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">AI Phoneが解決します</h2>
          <p className="text-slate-500 text-center mb-12">AIが自然な日本語で電話応対。用件を聞き取り、管理画面に自動記録。</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Phone, title: 'AIが自動で電話応対', desc: '自然な日本語で会話。予約受付・問い合わせ・道案内まで対応。お客様はAIだと気づかないレベル。' },
              { icon: FileText, title: '通話内容を自動要約', desc: '誰から、何の用件で、どんな内容だったか。AIが自動で要約して管理画面に表示。' },
              { icon: Bell, title: '朝、管理画面を開くだけ', desc: '夜間・休日の電話も全て記録。翌朝、一覧を確認して対応するだけ。' },
              { icon: Clock, title: '24時間365日対応', desc: '営業時間外も、お盆も、年末年始も。AIは休みません。' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4 p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">使い方はかんたん3ステップ</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: '店舗情報を登録', desc: '営業時間、メニュー、よくある質問を管理画面で入力するだけ。' },
              { step: '2', title: '電話番号を設定', desc: '専用の電話番号にAI応答を設定。既存の番号からの転送もOK。' },
              { step: '3', title: '翌朝確認するだけ', desc: '通話ログを開けば、誰から何の電話があったか一目瞭然。' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">料金プラン</h2>
          <p className="text-slate-500 text-center mb-12">パートを1人雇うより、圧倒的に安い。</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Lite', price: '2,980', desc: '個人経営の飲食店に', features: ['月50通話まで', 'AI自動応答（日本語）', '予約受付・空席確認', '管理画面', 'LINE通知'] },
              { name: 'Standard', price: '9,800', desc: '予約が多い店舗向け', features: ['通話無制限', '全Lite機能', '多言語対応（英中）', 'コース提案（アップセル）', 'SMS通知・リマインド', '専用050番号'], popular: true },
              { name: 'Pro', price: '29,800', desc: '複数店舗・チェーン', features: ['全Standard機能', '最大5店舗一括管理', '月次分析レポート自動生成', 'Googleカレンダー連携', 'カスタムAIペルソナ', '優先サポート'] },
            ].map((plan, i) => (
              <div key={i} className={`rounded-xl p-6 border ${plan.popular ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'} relative`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    おすすめ
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  ¥{plan.price}<span className="text-sm font-normal text-slate-400">/月</span>
                </p>
                <p className="text-xs text-slate-400 mb-6">税別</p>
                <ul className="space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            ※ 比較: パート電話番の人件費 月15〜20万円
          </p>
        </div>
      </section>

      {/* Target */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">こんな業種にぴったり</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['飲食店', '美容院・サロン', 'クリニック・歯科', '不動産', '士業事務所', 'スクール・教室', 'ホテル・旅館', 'EC・通販'].map((biz, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-slate-200 text-center text-sm font-medium text-slate-700">
                {biz}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta CTA */}
      <section id="beta" className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">βテスト参加者募集中</h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            先着3店舗限定で、無料でAI Phone をお試しいただけます。<br />
            セットアップのサポートも無料で行います。
          </p>
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
            <div className="space-y-3 text-left mb-6">
              {['初期費用: 無料', 'βテスト期間: 1ヶ月間無料', 'セットアップサポート付き', 'β終了後の継続利用は割引あり'].map((item, i) => (
                <p key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-indigo-500" /> {item}
                </p>
              ))}
            </div>
            <a
              href="https://forms.gle/xxxxx"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-indigo-600 text-white py-3 rounded-lg text-center font-medium hover:bg-indigo-700 transition"
            >
              βテストに申し込む
            </a>
            <p className="text-xs text-slate-400 mt-3 text-center">
              ※ Google Forms に遷移します
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Phone className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-600">AI Phone by Centaurus</span>
          </div>
          <p className="text-xs text-slate-400">2026 Centaurus Inc.</p>
        </div>
      </footer>
    </div>
  );
}
