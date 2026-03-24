'use client';

import { useState, useEffect } from 'react';
import { Save, Check, ChevronDown, ChevronUp, Plus, X, Sparkles } from 'lucide-react';

interface StoreTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  defaultBusinessHours: string;
  defaultClosedDays: string;
  defaultTone: string;
  defaultGreeting: string;
  defaultFallback: string;
  faqs: { question: string; answer: string }[];
  menuItems: { name: string; price: string }[];
}

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Record<string, StoreTemplate[]>>({});
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [store, setStore] = useState({
    name: '',
    phone_number: '',
    address: '',
    business_hours: '',
    closed_days: '',
    seat_count: '',
    tone: 'polite',
    greeting: '',
    fallback_message: '',
  });

  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [menuItems, setMenuItems] = useState<{ name: string; price: string }[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(console.error);
  }, []);

  const applyTemplate = (template: StoreTemplate) => {
    setSelectedTemplate(template.id);
    setStore(prev => ({
      ...prev,
      business_hours: template.defaultBusinessHours,
      closed_days: template.defaultClosedDays,
      tone: template.defaultTone,
      greeting: template.defaultGreeting,
      fallback_message: template.defaultFallback,
    }));
    setFaqs([...template.faqs]);
    setMenuItems([...template.menuItems]);
    setShowTemplates(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">店舗設定</h2>
          <p className="text-sm text-slate-500 mt-1">AI電話応答の設定を管理</p>
        </div>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> 設定を保存しました
        </div>
      )}

      {/* Template Selector */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <div className="text-left">
              <h3 className="font-semibold text-slate-900">業種テンプレートから始める</h3>
              <p className="text-sm text-slate-500">業種を選ぶと、FAQ・メニュー・設定が自動で入力されます</p>
            </div>
          </div>
          {showTemplates ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showTemplates && (
          <div className="px-6 pb-6 border-t border-slate-100 pt-4">
            {Object.entries(templates).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition ${
                        selectedTemplate === t.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="font-medium">{t.name}</span>
                      {selectedTemplate === t.id && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">基本情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">店舗名 <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              placeholder="例: 和食処さくら" value={store.name} onChange={e => setStore({...store, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">電話番号</label>
              <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                placeholder="03-1234-5678" value={store.phone_number} onChange={e => setStore({...store, phone_number: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">席数</label>
              <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                placeholder="40" value={store.seat_count} onChange={e => setStore({...store, seat_count: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">住所</label>
            <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              placeholder="東京都渋谷区..." value={store.address} onChange={e => setStore({...store, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">営業時間</label>
              <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                value={store.business_hours} onChange={e => setStore({...store, business_hours: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">定休日</label>
              <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                value={store.closed_days} onChange={e => setStore({...store, closed_days: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">AI応答設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">応答トーン</label>
            <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              value={store.tone} onChange={e => setStore({...store, tone: e.target.value})}>
              <option value="polite">丁寧（〜でございます）</option>
              <option value="casual">カジュアル（〜ですね）</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挨拶文</label>
            <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              value={store.greeting} onChange={e => setStore({...store, greeting: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">回答できない場合のメッセージ</label>
            <textarea className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              value={store.fallback_message} onChange={e => setStore({...store, fallback_message: e.target.value})} />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">よくある質問（FAQ）</h3>
          <button onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> 追加
          </button>
        </div>
        {faqs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">テンプレートを選択するか、手動で追加してください</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-4 relative group">
                <button onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <X className="w-4 h-4" />
                </button>
                <input type="text" placeholder="質問" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  value={faq.question} onChange={e => { const u=[...faqs]; u[i].question=e.target.value; setFaqs(u); }} />
                <input type="text" placeholder="回答" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  value={faq.answer} onChange={e => { const u=[...faqs]; u[i].answer=e.target.value; setFaqs(u); }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">メニュー / サービス</h3>
          <button onClick={() => setMenuItems([...menuItems, { name: '', price: '' }])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> 追加
          </button>
        </div>
        {menuItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">テンプレートを選択するか、手動で追加してください</p>
        ) : (
          <div className="space-y-2">
            {menuItems.map((item, i) => (
              <div key={i} className="flex gap-3 items-center group">
                <input type="text" placeholder="メニュー名" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  value={item.name} onChange={e => { const u=[...menuItems]; u[i].name=e.target.value; setMenuItems(u); }} />
                <input type="text" placeholder="価格" className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  value={item.price} onChange={e => { const u=[...menuItems]; u[i].price=e.target.value; setMenuItems(u); }} />
                <button onClick={() => setMenuItems(menuItems.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <button onClick={handleSave}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> 設定を保存
      </button>
    </div>
  );
}
