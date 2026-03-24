/**
 * 業種別テンプレート - 日本国内の店舗型ビジネス
 */

export interface StoreTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  defaultBusinessHours: string;
  defaultClosedDays: string;
  defaultTone: 'polite' | 'casual';
  defaultGreeting: string;
  defaultFallback: string;
  faqs: { question: string; answer: string }[];
  menuItems: { name: string; price: string }[];
  systemPromptExtra: string;
}

export const storeTemplates: StoreTemplate[] = [
  // ─── 飲食 ───
  {
    id: 'restaurant-japanese',
    name: '和食・日本料理',
    icon: '🍣',
    category: '飲食',
    defaultBusinessHours: '11:00〜14:00、17:00〜22:00',
    defaultClosedDays: '毎週月曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。お名前とお電話番号をお願いいたします。',
    faqs: [
      { question: '駐車場はありますか', answer: '店舗前に5台分の駐車場がございます。' },
      { question: '個室はありますか', answer: '4名様用と8名様用の個室がございます。ご予約時にお申し付けください。' },
      { question: 'アレルギー対応は可能ですか', answer: 'はい、事前にお知らせいただければ対応いたします。' },
      { question: '子連れでも大丈夫ですか', answer: 'はい、お子様用の椅子もご用意しております。' },
    ],
    menuItems: [
      { name: 'ランチ定食', price: '1,200円' },
      { name: 'おまかせコース', price: '5,000円' },
      { name: '宴会コース', price: '4,000円〜' },
    ],
    systemPromptExtra: '予約の場合は日時・人数・お名前・連絡先・個室希望の有無をお伺いしてください。',
  },
  {
    id: 'restaurant-casual',
    name: '居酒屋・カフェ・バー',
    icon: '🍺',
    category: '飲食',
    defaultBusinessHours: '17:00〜24:00',
    defaultClosedDays: '不定休',
    defaultTone: 'casual',
    defaultGreeting: 'お電話ありがとうございます！',
    defaultFallback: '確認して折り返しますね。お名前とお電話番号をお願いします。',
    faqs: [
      { question: '予約なしでも入れますか', answer: 'はい、お席が空いていればご案内できます。混雑時はご予約をおすすめします。' },
      { question: '飲み放題はありますか', answer: '2時間飲み放題のコースがございます。詳しくはお問い合わせください。' },
      { question: '貸切はできますか', answer: '20名様以上で貸切のご相談を承っております。' },
    ],
    menuItems: [
      { name: '飲み放題コース', price: '3,500円〜' },
      { name: 'おつまみ各種', price: '400円〜' },
    ],
    systemPromptExtra: '予約の場合は日時・人数・お名前・連絡先・コース希望の有無をお伺いしてください。',
  },
  {
    id: 'restaurant-ramen',
    name: 'ラーメン・うどん・そば',
    icon: '🍜',
    category: '飲食',
    defaultBusinessHours: '11:00〜21:00',
    defaultClosedDays: '毎週水曜日',
    defaultTone: 'casual',
    defaultGreeting: 'お電話ありがとうございます！',
    defaultFallback: '確認して折り返しますね。',
    faqs: [
      { question: '予約はできますか', answer: '申し訳ございません、予約は承っておりません。先着順でのご案内となります。' },
      { question: '持ち帰りはできますか', answer: 'はい、テイクアウトメニューがございます。お電話でご注文いただけます。' },
      { question: '待ち時間はどのくらいですか', answer: '混雑状況により異なりますが、ピーク時は30分〜1時間ほどお待ちいただく場合がございます。' },
    ],
    menuItems: [
      { name: '特製ラーメン', price: '950円' },
      { name: 'チャーシュー麺', price: '1,100円' },
      { name: '餃子（6個）', price: '400円' },
    ],
    systemPromptExtra: 'テイクアウト注文の場合はメニュー・数量・お名前・来店予定時刻をお伺いしてください。',
  },
  {
    id: 'bakery-cake',
    name: 'パン屋・ケーキ屋・スイーツ',
    icon: '🍰',
    category: '飲食',
    defaultBusinessHours: '9:00〜19:00',
    defaultClosedDays: '毎週火曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: 'ケーキの予約はできますか', answer: 'はい、3日前までにご予約いただけます。' },
      { question: 'アレルギー対応はありますか', answer: '卵・乳不使用のケーキもご用意できます。ご相談ください。' },
      { question: '配達はできますか', answer: '申し訳ございません、店頭でのお渡しのみとなっております。' },
    ],
    menuItems: [
      { name: 'ホールケーキ（5号）', price: '3,500円〜' },
      { name: 'デコレーションケーキ', price: '4,500円〜' },
      { name: '焼き菓子ギフト', price: '2,000円〜' },
    ],
    systemPromptExtra: 'ケーキの予約の場合はサイズ・種類・受取日時・お名前・連絡先・メッセージプレートの有無をお伺いしてください。',
  },

  // ─── 美容・健康 ───
  {
    id: 'beauty-salon',
    name: '美容院・ヘアサロン',
    icon: '💇',
    category: '美容・健康',
    defaultBusinessHours: '10:00〜20:00',
    defaultClosedDays: '毎週火曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。お名前とお電話番号をお願いいたします。',
    faqs: [
      { question: '当日予約はできますか', answer: '空きがあればご予約可能です。お気軽にお問い合わせください。' },
      { question: '駐車場はありますか', answer: '店舗裏に3台分の駐車場がございます。' },
      { question: 'カラーとカットで何時間くらいかかりますか', answer: '約2時間〜2時間半を目安にお考えください。' },
      { question: '指名はできますか', answer: 'はい、ご予約時にスタイリスト名をお伝えください。指名料はかかりません。' },
    ],
    menuItems: [
      { name: 'カット', price: '4,500円' },
      { name: 'カラー', price: '6,000円〜' },
      { name: 'パーマ', price: '7,000円〜' },
      { name: 'トリートメント', price: '3,000円〜' },
    ],
    systemPromptExtra: '予約の場合は希望日時・メニュー・担当者の指名・お名前・連絡先をお伺いしてください。',
  },
  {
    id: 'nail-salon',
    name: 'ネイルサロン・まつエク',
    icon: '💅',
    category: '美容・健康',
    defaultBusinessHours: '10:00〜20:00',
    defaultClosedDays: '不定休',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '初めてですが予約できますか', answer: 'はい、初めての方も大歓迎です。カウンセリング込みでご予約承ります。' },
      { question: '施術時間はどのくらいですか', answer: 'ジェルネイルで約1時間半〜2時間が目安です。' },
      { question: 'オフのみでも予約できますか', answer: 'はい、オフのみのご予約も承っております。' },
    ],
    menuItems: [
      { name: 'ジェルネイル', price: '6,000円〜' },
      { name: 'まつげエクステ', price: '5,000円〜' },
      { name: 'オフのみ', price: '2,000円' },
    ],
    systemPromptExtra: '予約の場合は希望日時・メニュー・お名前・連絡先をお伺いしてください。初めての方にはカウンセリング時間も案内してください。',
  },
  {
    id: 'massage-seitai',
    name: '整体・マッサージ・鍼灸',
    icon: '💆',
    category: '美容・健康',
    defaultBusinessHours: '10:00〜21:00',
    defaultClosedDays: '毎週日曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '保険は使えますか', answer: '症状によっては健康保険が適用される場合がございます。初回にご相談ください。' },
      { question: '初回はどのくらい時間がかかりますか', answer: '初回はカウンセリング込みで約1時間を予定しています。' },
      { question: '妊娠中でも施術を受けられますか', answer: '安定期に入られている方であれば対応可能です。事前にご相談ください。' },
    ],
    menuItems: [
      { name: '全身整体（60分）', price: '5,500円' },
      { name: '部分施術（30分）', price: '3,300円' },
      { name: '鍼灸治療', price: '4,400円' },
      { name: '初回カウンセリング', price: '無料' },
    ],
    systemPromptExtra: '予約の場合は希望日時・症状やお悩み・お名前・連絡先をお伺いしてください。',
  },
  {
    id: 'fitness-gym',
    name: 'フィットネス・ジム・ヨガ',
    icon: '🏋️',
    category: '美容・健康',
    defaultBusinessHours: '7:00〜22:00',
    defaultClosedDays: '年末年始のみ',
    defaultTone: 'casual',
    defaultGreeting: 'お電話ありがとうございます！',
    defaultFallback: '確認して折り返しますね。',
    faqs: [
      { question: '体験レッスンはありますか', answer: 'はい、初回体験は無料で受けられます。お気軽にどうぞ。' },
      { question: '入会金はいくらですか', answer: '入会金は10,000円ですが、キャンペーン中は無料の場合もございます。' },
      { question: 'シャワーはありますか', answer: 'はい、シャワールーム完備です。タオルのレンタルもございます。' },
    ],
    menuItems: [
      { name: '月額会員', price: '8,800円/月' },
      { name: 'パーソナルトレーニング', price: '6,600円/回' },
      { name: 'ビジター利用', price: '2,200円/回' },
    ],
    systemPromptExtra: '体験レッスンの予約の場合は希望日時・お名前・連絡先・運動経験をお伺いしてください。',
  },

  // ─── 医療 ───
  {
    id: 'clinic-general',
    name: 'クリニック・内科・小児科',
    icon: '🏥',
    category: '医療',
    defaultBusinessHours: '9:00〜12:30、14:30〜18:00',
    defaultClosedDays: '日曜日・祝日、木曜午後',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。お名前とお電話番号をお願いいたします。',
    faqs: [
      { question: '予約は必要ですか', answer: '予約優先制です。お電話またはWeb予約をおすすめいたします。' },
      { question: '初診ですが受診できますか', answer: 'はい、初診の方も受け付けております。保険証をお持ちください。' },
      { question: '駐車場はありますか', answer: 'クリニック前に10台分の駐車場がございます。' },
      { question: 'インフルエンザの予防接種はやっていますか', answer: '実施しております。在庫状況はお電話でご確認ください。' },
    ],
    menuItems: [],
    systemPromptExtra: '予約の場合は希望日時・患者様のお名前・生年月日・症状・初診か再診かをお伺いしてください。医療行為に関する具体的なアドバイスは行わず、来院を促してください。',
  },
  {
    id: 'dental',
    name: '歯科医院',
    icon: '🦷',
    category: '医療',
    defaultBusinessHours: '9:30〜13:00、14:30〜19:00',
    defaultClosedDays: '日曜日・祝日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '急な歯の痛みですが今日見てもらえますか', answer: '急患の方は随時受け付けております。お早めにご来院ください。' },
      { question: 'ホワイトニングはやっていますか', answer: 'はい、オフィスホワイトニングとホームホワイトニングをご用意しております。' },
      { question: '子どもの治療もできますか', answer: 'はい、お子様の治療も対応しております。' },
    ],
    menuItems: [],
    systemPromptExtra: '予約の場合は希望日時・患者様のお名前・症状（定期検診/治療/急患）をお伺いしてください。治療方針に関する具体的な回答は避け、来院時に歯科医師が説明する旨を伝えてください。',
  },

  // ─── 不動産 ───
  {
    id: 'real-estate',
    name: '不動産・賃貸・売買',
    icon: '🏠',
    category: '不動産',
    defaultBusinessHours: '9:00〜18:00',
    defaultClosedDays: '毎週水曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者から折り返しお電話いたします。お名前とご連絡先をお願いいたします。',
    faqs: [
      { question: '内見の予約をしたいのですが', answer: 'はい、内見のご予約を承ります。ご希望の物件名と日時をお教えください。' },
      { question: '初期費用はどのくらいかかりますか', answer: '物件により異なりますが、目安として家賃の4〜5ヶ月分程度です。詳しくは担当者がご説明いたします。' },
      { question: 'ペット可の物件はありますか', answer: 'ペット可の物件もございます。ご希望の条件をお聞かせください。' },
    ],
    menuItems: [],
    systemPromptExtra: '物件のお問い合わせの場合は物件名（わかれば）・希望エリア・間取り・予算・入居時期・お名前・連絡先をお伺いしてください。',
  },

  // ─── 士業 ───
  {
    id: 'law-office',
    name: '弁護士・司法書士・行政書士',
    icon: '⚖️',
    category: '士業',
    defaultBusinessHours: '9:00〜18:00',
    defaultClosedDays: '土曜日・日曜日・祝日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者から折り返しお電話いたします。お名前とご連絡先をお願いいたします。',
    faqs: [
      { question: '初回相談は無料ですか', answer: '初回30分のご相談は無料です。ご予約の上お越しください。' },
      { question: '相談の予約をしたいのですが', answer: 'ご予約を承ります。ご希望の日時とご相談内容の概要をお聞かせください。' },
      { question: '費用はどのくらいかかりますか', answer: 'ご相談内容により異なります。初回相談時に詳しくご説明いたします。' },
    ],
    menuItems: [
      { name: '初回相談', price: '無料（30分）' },
      { name: '法律相談', price: '5,500円/30分' },
    ],
    systemPromptExtra: '相談の予約の場合は希望日時・お名前・連絡先・相談内容の概要をお伺いしてください。法的アドバイスは行わず、面談時に弁護士が対応する旨を伝えてください。',
  },
  {
    id: 'tax-office',
    name: '税理士・会計事務所',
    icon: '📊',
    category: '士業',
    defaultBusinessHours: '9:00〜17:30',
    defaultClosedDays: '土曜日・日曜日・祝日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者から折り返しお電話いたします。',
    faqs: [
      { question: '顧問契約の費用はいくらですか', answer: '事業規模により異なります。月額2万円〜承っております。詳しくは面談時にご説明いたします。' },
      { question: '確定申告だけお願いできますか', answer: 'はい、確定申告のみのご依頼も承っております。' },
      { question: '初回相談は無料ですか', answer: 'はい、初回のご面談は無料です。' },
    ],
    menuItems: [
      { name: '顧問契約', price: '月額20,000円〜' },
      { name: '確定申告', price: '50,000円〜' },
      { name: '会社設立支援', price: '100,000円〜' },
    ],
    systemPromptExtra: '相談予約の場合は希望日時・お名前・連絡先・事業内容・相談内容の概要をお伺いしてください。',
  },

  // ─── 教育 ───
  {
    id: 'school-cram',
    name: '学習塾・予備校',
    icon: '📚',
    category: '教育',
    defaultBusinessHours: '14:00〜22:00',
    defaultClosedDays: '日曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者から折り返しお電話いたします。',
    faqs: [
      { question: '体験授業はありますか', answer: 'はい、無料体験授業を実施しております。お気軽にお申し込みください。' },
      { question: '月謝はいくらですか', answer: '学年・コースにより異なります。詳しくは面談時にご説明いたします。' },
      { question: '途中入塾はできますか', answer: 'はい、いつでも入塾可能です。個別にカリキュラムを組みます。' },
    ],
    menuItems: [
      { name: '個別指導（週1回）', price: '月額15,000円〜' },
      { name: '集団授業（週2回）', price: '月額20,000円〜' },
    ],
    systemPromptExtra: 'お問い合わせの場合はお子様の学年・現在の状況・お名前・保護者の連絡先をお伺いしてください。',
  },
  {
    id: 'culture-school',
    name: '習い事・カルチャースクール',
    icon: '🎨',
    category: '教育',
    defaultBusinessHours: '10:00〜20:00',
    defaultClosedDays: '毎週月曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '体験レッスンはありますか', answer: 'はい、各コース1回無料で体験できます。' },
      { question: '初心者でも大丈夫ですか', answer: 'はい、初心者の方も多くいらっしゃいます。丁寧に指導いたします。' },
      { question: '道具は必要ですか', answer: '体験時はすべてお貸しします。入会後にご自身のものをご用意いただきます。' },
    ],
    menuItems: [
      { name: '月謝（月4回）', price: '8,000円〜' },
      { name: '入会金', price: '5,000円' },
    ],
    systemPromptExtra: '体験レッスンの予約の場合は希望日時・希望コース・お名前・連絡先をお伺いしてください。',
  },

  // ─── 宿泊 ───
  {
    id: 'hotel-ryokan',
    name: 'ホテル・旅館・民宿',
    icon: '🏨',
    category: '宿泊',
    defaultBusinessHours: '24時間',
    defaultClosedDays: 'なし',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: 'チェックインは何時からですか', answer: 'チェックインは15時から、チェックアウトは10時までとなっております。' },
      { question: '駐車場はありますか', answer: 'はい、無料駐車場がございます。' },
      { question: 'キャンセル料はかかりますか', answer: '3日前から50%、前日・当日は100%のキャンセル料が発生します。' },
    ],
    menuItems: [
      { name: 'シングルルーム', price: '8,000円〜/泊' },
      { name: 'ツインルーム', price: '14,000円〜/泊' },
      { name: '夕朝食付きプラン', price: '+5,000円' },
    ],
    systemPromptExtra: '予約の場合は宿泊日・泊数・部屋タイプ・人数・お名前・連絡先・食事の有無をお伺いしてください。',
  },

  // ─── ペット ───
  {
    id: 'pet-shop',
    name: 'ペットショップ・トリミング',
    icon: '🐕',
    category: 'ペット',
    defaultBusinessHours: '10:00〜19:00',
    defaultClosedDays: '毎週木曜日',
    defaultTone: 'casual',
    defaultGreeting: 'お電話ありがとうございます！',
    defaultFallback: '確認して折り返しますね。',
    faqs: [
      { question: 'トリミングの予約をしたいのですが', answer: 'ご予約承ります。ワンちゃんの犬種とサイズを教えてください。' },
      { question: 'ペットホテルはありますか', answer: 'はい、お預かりサービスがございます。1泊から承ります。' },
      { question: '初めてですが大丈夫ですか', answer: 'もちろんです！初めてのワンちゃんも優しく対応します。' },
    ],
    menuItems: [
      { name: 'トリミング（小型犬）', price: '5,000円〜' },
      { name: 'トリミング（中型犬）', price: '7,000円〜' },
      { name: 'ペットホテル', price: '3,500円/泊〜' },
    ],
    systemPromptExtra: 'トリミング予約の場合は希望日時・ペットの犬種とサイズ・お名前・連絡先をお伺いしてください。',
  },
  {
    id: 'vet-clinic',
    name: '動物病院',
    icon: '🐾',
    category: 'ペット',
    defaultBusinessHours: '9:00〜12:00、16:00〜19:00',
    defaultClosedDays: '日曜午後・祝日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '急患は受け付けていますか', answer: 'はい、診療時間内であれば急患も受け付けております。まずはお電話ください。' },
      { question: '予防接種の予約をしたいのですが', answer: 'ご予約承ります。ワクチンの種類と希望日をお知らせください。' },
      { question: '猫も診てもらえますか', answer: 'はい、犬・猫・小動物を診察しております。' },
    ],
    menuItems: [],
    systemPromptExtra: '予約の場合は希望日時・ペットの種類と名前・症状や目的（予防接種/定期検診/急患）・飼い主様のお名前・連絡先をお伺いしてください。',
  },

  // ─── 自動車 ───
  {
    id: 'car-dealer',
    name: '自動車販売・整備・車検',
    icon: '🚗',
    category: '自動車',
    defaultBusinessHours: '9:00〜18:00',
    defaultClosedDays: '毎週水曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者から折り返しお電話いたします。',
    faqs: [
      { question: '車検の予約をしたいのですが', answer: 'ご予約承ります。車種と車検満了日をお知らせください。' },
      { question: '代車はありますか', answer: 'はい、無料の代車をご用意しております。事前にご予約ください。' },
      { question: '見積もりだけでもいいですか', answer: 'はい、お見積もりのみも承っております。お気軽にどうぞ。' },
    ],
    menuItems: [
      { name: '車検（軽自動車）', price: '45,000円〜' },
      { name: '車検（普通車）', price: '55,000円〜' },
      { name: 'オイル交換', price: '3,000円〜' },
    ],
    systemPromptExtra: '車検予約の場合は車種・年式・車検満了日・代車の要否・お名前・連絡先をお伺いしてください。',
  },

  // ─── 生活サービス ───
  {
    id: 'cleaning',
    name: 'クリーニング',
    icon: '👔',
    category: '生活サービス',
    defaultBusinessHours: '8:00〜19:00',
    defaultClosedDays: '日曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '仕上がりはいつですか', answer: '通常3〜5日でお渡しできます。お急ぎの場合は当日仕上げも承ります。' },
      { question: '集配サービスはありますか', answer: 'はい、ご自宅への集配サービスがございます。' },
      { question: '布団のクリーニングはできますか', answer: 'はい、布団クリーニングも承っております。' },
    ],
    menuItems: [
      { name: 'ワイシャツ', price: '250円' },
      { name: 'スーツ上下', price: '1,200円' },
      { name: '布団（1枚）', price: '4,000円' },
    ],
    systemPromptExtra: '集配の予約の場合は希望日時・お名前・ご住所・連絡先をお伺いしてください。',
  },
  {
    id: 'photo-studio',
    name: '写真スタジオ',
    icon: '📸',
    category: '生活サービス',
    defaultBusinessHours: '9:00〜18:00',
    defaultClosedDays: '毎週水曜日',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '七五三の撮影をしたいのですが', answer: 'ご予約承ります。衣装レンタル付きのプランもございます。' },
      { question: 'データはもらえますか', answer: 'はい、撮影データはUSBまたはダウンロードでお渡しします。' },
      { question: '何着まで着替えられますか', answer: 'プランにより異なりますが、通常2〜3着の着替えが可能です。' },
    ],
    menuItems: [
      { name: '七五三プラン', price: '30,000円〜' },
      { name: '証明写真', price: '1,500円' },
      { name: 'ファミリーフォト', price: '20,000円〜' },
    ],
    systemPromptExtra: '撮影予約の場合は撮影内容（七五三/お宮参り/証明写真等）・希望日時・人数・衣装レンタルの要否・お名前・連絡先をお伺いしてください。',
  },
  {
    id: 'funeral',
    name: '葬儀社・セレモニーホール',
    icon: '🕊️',
    category: '生活サービス',
    defaultBusinessHours: '24時間',
    defaultClosedDays: 'なし',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '担当者がすぐに折り返しお電話いたします。',
    faqs: [
      { question: '急な不幸がありました', answer: '承知いたしました。すぐに担当者がお電話いたします。まず、場所とお名前をお聞かせください。' },
      { question: '事前相談はできますか', answer: 'はい、無料で事前相談を承っております。ご予約の上お越しください。' },
      { question: '費用の目安を教えてください', answer: 'プランにより異なりますが、家族葬で30万円〜承っております。詳しくはご面談時にご説明いたします。' },
    ],
    menuItems: [
      { name: '家族葬プラン', price: '300,000円〜' },
      { name: '一般葬プラン', price: '600,000円〜' },
      { name: '事前相談', price: '無料' },
    ],
    systemPromptExtra: '緊急の場合は最優先で対応してください。場所・お名前・連絡先を最初にお伺いし、「すぐに担当者から折り返します」と伝えてください。事前相談の場合は希望日時・お名前・連絡先をお伺いしてください。',
  },
  {
    id: 'flower-shop',
    name: '花屋・フラワーショップ',
    icon: '💐',
    category: '生活サービス',
    defaultBusinessHours: '9:00〜19:00',
    defaultClosedDays: '不定休',
    defaultTone: 'polite',
    defaultGreeting: 'お電話ありがとうございます。',
    defaultFallback: '確認して折り返しお電話いたします。',
    faqs: [
      { question: '配達はできますか', answer: 'はい、市内であれば配達を承っております。配達料は500円〜です。' },
      { question: '予算に合わせて作ってもらえますか', answer: 'はい、ご予算をお伝えいただければ、イメージに合わせてお作りします。' },
      { question: '供花を贈りたいのですが', answer: '承ります。お届け先と日時をお知らせください。' },
    ],
    menuItems: [
      { name: '花束', price: '3,000円〜' },
      { name: 'アレンジメント', price: '4,000円〜' },
      { name: 'スタンド花', price: '15,000円〜' },
    ],
    systemPromptExtra: '注文の場合は用途（誕生日/お祝い/お供え等）・ご予算・お届け日時・届け先住所・ご依頼者のお名前・連絡先をお伺いしてください。',
  },
];

// カテゴリ一覧を取得
export function getTemplateCategories(): string[] {
  const categories = new Set(storeTemplates.map(t => t.category));
  return Array.from(categories);
}

// カテゴリ別にテンプレートを取得
export function getTemplatesByCategory(): Record<string, StoreTemplate[]> {
  const result: Record<string, StoreTemplate[]> = {};
  for (const t of storeTemplates) {
    if (!result[t.category]) result[t.category] = [];
    result[t.category].push(t);
  }
  return result;
}
