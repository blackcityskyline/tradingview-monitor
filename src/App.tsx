import { useState } from 'react';

interface Library {
  id: string;
  name: string;
  author: string;
  language: string;
  stars: string;
  forks: string;
  lastUpdate: string;
  status: 'active' | 'archived' | 'maintenance';
  url: string;
  description: string;
  features: string[];
  limitations: string[];
  install: string;
  category: string;
}

const libraries: Library[] = [
  {
    id: 'mathieu2301',
    name: '@mathieuc/tradingview',
    author: 'Mathieu2301',
    language: 'JavaScript/TypeScript',
    stars: '5.1k',
    forks: '906',
    lastUpdate: 'Июнь 2026',
    status: 'active',
    url: 'https://github.com/Mathieu2301/TradingView-API',
    description: 'Самая популярная библиотека для получения данных в реальном времени из TradingView через WebSocket. Поддерживает индикаторы, бэктестинг и премиум-функции.',
    features: [
      'Данные в реальном времени (Realtime WebSocket)',
      'Получение значений индикаторов',
      'Автоматический бэктестинг стратегий',
      'Работа с invite-only индикаторами',
      'Неограниченное количество одновременных индикаторов',
      'Технический анализ TradingView',
      'Replay mode (включая фейковый для бесплатного плана)',
      'Получение данных за конкретный диапазон дат',
      'Получение рисунков с графика',
      'Premium функции',
      'Поиск символов',
      'Hotlists',
      'Calendar events',
    ],
    limitations: [
      'Нет эмуляции сервера TradingView socket',
      'Нет взаимодействия с публичными чатами',
      'Требует аккаунт TradingView для некоторых функций',
    ],
    install: 'npm i @mathieuc/tradingview',
    category: 'Realtime Data',
  },
  {
    id: 'shner-elmo',
    name: 'tradingview-screener',
    author: 'shner-elmo',
    language: 'Python',
    stars: '1.3k',
    forks: '175',
    lastUpdate: 'Сентябрь 2026',
    status: 'active',
    url: 'https://github.com/shner-elmo/TradingView-Screener',
    description: 'Python пакет для создания кастомных скринеров акций через официальный API TradingView. Поддерживает SQL-подобный синтаксис для фильтрации.',
    features: [
      'Акции (~70 стран), опционы, крипто, форекс, CFD, фьючерсы, облигации',
      '3000+ полей данных',
      'OHLC данные',
      'Технические индикаторы',
      'Фундаментальные метрики (P/E, EPS и др.)',
      'Все таймфреймы: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d, 1w, 1mo',
      'SQL-подобный синтаксис фильтрации (AND/OR)',
      'Реальное время (через cookies)',
      'Поддержка опционных цепей',
      'Внутренние поля TradingView',
      'Сортировка и пагинация',
      'Смешивание таймфреймов в одном запросе',
    ],
    limitations: [
      'Не является библиотекой для реального времени через WebSocket',
      'Для real-time данных нужны cookies/аутентификация',
      'Ограничение по количеству строк (по умолчанию 50)',
    ],
    install: 'pip install tradingview-screener',
    category: 'Screener',
  },
  {
    id: 'deepentropy',
    name: 'tvscreener',
    author: 'deepentropy',
    language: 'Python',
    stars: '1.6k',
    forks: '222',
    lastUpdate: 'Сентябрь 2026',
    status: 'active',
    url: 'https://github.com/deepentropy/tvscreener',
    description: 'Расширенная библиотека для скрининга с 13,000+ полями, поддержкой MCP (Model Context Protocol) для AI-ассистентов и Pandas DataFrame выводом.',
    features: [
      '6 типов скринеров: Stock, Forex, Crypto, Bond, Futures, Coin',
      '13,000+ полей данных',
      'Fluent API с select() и where()',
      'Pythonic синтаксис сравнений',
      'Field Discovery - поиск полей по имени',
      'Field Presets - готовые наборы полей',
      'Type-safe валидация',
      'MCP Server для AI-ассистентов (Claude)',
      'Streaming/Auto-update',
      'Styled output (TradingView-стилизация)',
      'Все таймфреймы для технических индикаторов',
      'Результаты в Pandas DataFrame',
      'Code Generator для визуального построения запросов',
      'Jupyter Notebooks с примерами',
    ],
    limitations: [
      'Только Python',
      'Streaming требует периодических запросов (не настоящий WebSocket)',
      'Может быть заблокирован при частых запросах',
    ],
    install: 'pip install tvscreener',
    category: 'Screener',
  },
  {
    id: 'analyzerrest',
    name: 'python-tradingview-ta',
    author: 'AnalyzerREST',
    language: 'Python',
    stars: '1.3k',
    forks: '268',
    lastUpdate: 'Архивирован (Июнь 2024)',
    status: 'archived',
    url: 'https://github.com/AnalyzerREST/python-tradingview-ta',
    description: 'Неофициальный Python wrapper для получения технического анализа из TradingView. Поддерживает множественные символы и индикаторы.',
    features: [
      'Получение технического анализа',
      'Поддержка множества символов',
      'Встроенные индикаторы TradingView',
      'Быстрый ответ (без Selenium)',
      'Рекомендации BUY/SELL/NEUTRAL',
      'Поддержка прокси',
      'Все биржи и скринеры',
      'Множественные интервалы',
    ],
    limitations: [
      'Архивирован - больше не поддерживается',
      'Не поддерживает Pine Script/кастомные индикаторы',
      'Технический анализ для индексов не поддерживается',
      'Нет реального времени',
    ],
    install: 'pip install tradingview-ta',
    category: 'Technical Analysis',
  },
  {
    id: 'mohamadkhalaj',
    name: 'TradingView-API (Python)',
    author: 'mohamadkhalaj',
    language: 'Python',
    stars: '800+',
    forks: '200+',
    lastUpdate: '2025',
    status: 'maintenance',
    url: 'https://github.com/mohamadkhalaj/tradingView-API',
    description: 'Python клиент для TradingView WebSocket API. Предоставляет данные в реальном времени и поиск символов.',
    features: [
      'Данные в реальном времени через WebSocket',
      'Поиск символов',
      'Получение рыночных данных',
      'Простой Python API',
      'Поддержка различных рынков',
    ],
    limitations: [
      'Меньше функций чем у Mathieu2301 версии',
      'Ограниченная документация',
      'В режиме поддержки',
    ],
    install: 'pip install TradingView-API',
    category: 'Realtime Data',
  },
  {
    id: 'imxeno',
    name: 'tradingview-scraper',
    author: 'imxeno',
    language: 'JavaScript (Node.js)',
    stars: '500+',
    forks: '100+',
    lastUpdate: '2023',
    status: 'maintenance',
    url: 'https://github.com/imxeno/tradingview-scraper',
    description: 'Базовый TradingView data scraper для Node.js. Простая реализация для получения данных с графиков.',
    features: [
      'Базовый скрейпинг данных',
      'Node.js совместимость',
      'Простая установка',
      'Получение ценовых данных',
    ],
    limitations: [
      'Очень базовый функционал',
      'Нет поддержки индикаторов',
      'Нет WebSocket',
      'Ограниченная поддержка',
    ],
    install: 'npm i tradingview-scraper',
    category: 'Scraper',
  },
  {
    id: 'lightweight-charts',
    name: 'lightweight-charts',
    author: 'TradingView (Official)',
    language: 'TypeScript/JavaScript',
    stars: '10k+',
    forks: '800+',
    lastUpdate: '2026',
    status: 'active',
    url: 'https://github.com/tradingview/lightweight-charts',
    description: 'Официальная open-source библиотека от TradingView для отображения финансовых графиков. Высокая производительность, гибкая настройка.',
    features: [
      'Официальная библиотека TradingView',
      'Apache 2.0 лицензия',
      'Высокая производительность',
      'Свечные графики',
      'Линейные графики',
      'Area charts',
      'Bar charts',
      'Кастомные плагины',
      'Интерактивность (zoom, scroll, crosshair)',
      'Серии данных (Series)',
      'Markers и labels',
      'Time scale customization',
      'Price scale customization',
      'Responsive design',
      'Маленький размер бандла',
    ],
    limitations: [
      'Только визуализация (не получение данных)',
      'Нужен собственный источник данных',
      'Нет встроенного технического анализа',
    ],
    install: 'npm i lightweight-charts',
    category: 'Charting',
  },
  {
    id: 'charting-library',
    name: 'Advanced Charts (Charting Library)',
    author: 'TradingView (Official)',
    language: 'JavaScript',
    stars: 'N/A (private repo)',
    forks: 'N/A',
    lastUpdate: '2026',
    status: 'active',
    url: 'https://www.tradingview.com/charting-library-docs/latest/quick-start/',
    description: 'Официальная продвинутая библиотека графиков от TradingView. Полнофункциональное решение для отображения графиков с подключением к вашим данным.',
    features: [
      'Полнофункциональные графики как на TradingView.com',
      'Все типы графиков',
      'Встроенные индикаторы',
      'Drawing tools',
      'Alert system',
      'Watchlist',
      'Подключение к любому источнику данных',
      'Trading Terminal (опционально)',
      'Widget mode',
      'Standalone mode',
      'Mobile support',
      'Custom themes',
    ],
    limitations: [
      'Требует запрос доступа (не полностью open-source)',
      'Приватный GitHub репозиторий',
      'Лицензионные ограничения',
      'Сложная интеграция',
    ],
    install: 'Запрос доступа через tradingview.com',
    category: 'Charting',
  },
  {
    id: 'scrapingbee',
    name: 'tradingview-api (ScrapingBee)',
    author: 'ScrapingBee',
    language: 'JavaScript',
    stars: '100+',
    forks: '30+',
    lastUpdate: '2026',
    status: 'active',
    url: 'https://github.com/ScrapingBee/tradingview-api',
    description: 'TradingView API клиент построенный на ScrapingBee web scraping API. Обрабатывает прокси, браузеры и анти-бот защиту.',
    features: [
      'Автоматическая обработка анти-бот',
      'Ротация прокси',
      'Рендеринг JavaScript',
      'Чистый HTML или JSON',
      'Облачный сервис',
      'Простой API вызов',
    ],
    limitations: [
      'Требует аккаунт ScrapingBee (платный)',
      'Зависимость от стороннего сервиса',
      'Ограниченная бесплатная версия',
    ],
    install: 'npm i scrapingbee-tradingview-api',
    category: 'Scraper',
  },
];

const categories = ['Все', 'Realtime Data', 'Screener', 'Technical Analysis', 'Charting', 'Scraper'];

function StatusBadge({ status }: { status: Library['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    archived: 'bg-red-100 text-red-800 border-red-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  const labels = {
    active: '✅ Активен',
    archived: '📦 Архивирован',
    maintenance: '🔧 Поддержка',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function LibraryCard({ library, onSelect }: { library: Library; onSelect: (l: Library) => void }) {
  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer hover:-translate-y-1"
      onClick={() => onSelect(library)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{library.name}</h3>
            <p className="text-sm text-gray-500">by {library.author}</p>
          </div>
          <StatusBadge status={library.status} />
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{library.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
            {library.language}
          </span>
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
            {library.category}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {library.stars}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {library.forks}
          </span>
          <span className="text-xs text-gray-400">Обновлено: {library.lastUpdate}</span>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 font-mono truncate">{library.install}</p>
      </div>
    </div>
  );
}

function LibraryModal({ library, onClose }: { library: Library; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{library.name}</h2>
            <p className="text-gray-500 mt-1">by {library.author} • {library.language}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={library.status} />
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
              {library.category}
            </span>
            <span className="text-sm text-gray-500">⭐ {library.stars} | 🍴 {library.forks}</span>
          </div>
          
          <p className="text-gray-700 leading-relaxed">{library.description}</p>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-green-500">✓</span> Возможности
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {library.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          
          {library.limitations.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-red-500">✗</span> Ограничения
              </h3>
              <ul className="space-y-2">
                {library.limitations.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-red-400 mt-0.5">•</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Установка:</h4>
            <code className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-2 rounded block">
              {library.install}
            </code>
          </div>
          
          <div className="flex gap-3">
            <a
              href={library.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Открыть на GitHub
            </a>
            <span className="text-sm text-gray-400 self-center">
              Обновлено: {library.lastUpdate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const features = [
    { name: 'Real-time данные', key: 'realtime' },
    { name: 'Скринер акций', key: 'screener' },
    { name: 'Технический анализ', key: 'ta' },
    { name: 'Индикаторы', key: 'indicators' },
    { name: 'Бэктестинг', key: 'backtest' },
    { name: 'Визуализация', key: 'charts' },
    { name: 'WebSocket', key: 'websocket' },
    { name: 'Pandas DataFrame', key: 'pandas' },
    { name: 'Крипто', key: 'crypto' },
    { name: 'Форекс', key: 'forex' },
    { name: 'Фьючерсы', key: 'futures' },
    { name: 'Облигации', key: 'bonds' },
    { name: 'Опционы', key: 'options' },
  ];

  const data: Record<string, Record<string, boolean | string>> = {
    '@mathieuc/tradingview': {
      realtime: true, screener: false, ta: true, indicators: true,
      backtest: true, charts: false, websocket: true, pandas: false,
      crypto: '✓', forex: '✓', futures: '✓', bonds: false, options: false,
    },
    'tradingview-screener': {
      realtime: 'cookies', screener: true, ta: true, indicators: true,
      backtest: false, charts: false, websocket: false, pandas: true,
      crypto: true, forex: true, futures: true, bonds: true, options: true,
    },
    'tvscreener': {
      realtime: 'stream', screener: true, ta: true, indicators: true,
      backtest: false, charts: false, websocket: false, pandas: true,
      crypto: true, forex: true, futures: true, bonds: true, options: false,
    },
    'python-tradingview-ta': {
      realtime: false, screener: false, ta: true, indicators: true,
      backtest: false, charts: false, websocket: false, pandas: false,
      crypto: true, forex: true, futures: false, bonds: false, options: false,
    },
    'lightweight-charts': {
      realtime: false, screener: false, ta: false, indicators: false,
      backtest: false, charts: true, websocket: false, pandas: false,
      crypto: false, forex: false, futures: false, bonds: false, options: false,
    },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-3 font-semibold text-gray-700 border-b">Функция</th>
            {Object.keys(data).map((lib) => (
              <th key={lib} className="text-center p-3 font-semibold text-gray-700 border-b min-w-[120px]">
                <span className="text-xs">{lib}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key} className="hover:bg-gray-50">
              <td className="p-3 border-b text-gray-700 font-medium">{feature.name}</td>
              {Object.keys(data).map((lib) => {
                const val = data[lib][feature.key];
                return (
                  <td key={lib} className="p-3 border-b text-center">
                    {val === true && <span className="text-green-500 text-lg">✓</span>}
                    {val === false && <span className="text-gray-300 text-lg">—</span>}
                    {typeof val === 'string' && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{val}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cards' | 'comparison'>('cards');

  const filteredLibraries = libraries.filter((lib) => {
    const matchesCategory = selectedCategory === 'Все' || lib.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TradingView API Libraries</h1>
                <p className="text-xs text-gray-500">Обзор доступных библиотек на GitHub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === 'cards' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Карточки
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === 'comparison' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Сравнение
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{libraries.length}</p>
            <p className="text-sm text-gray-500">Библиотек найдено</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{libraries.filter(l => l.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Активных</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-purple-600">5</p>
            <p className="text-sm text-gray-500">Категорий</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-orange-600">3</p>
            <p className="text-sm text-gray-500">Языков</p>
          </div>
        </div>

        {activeTab === 'cards' && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск библиотек..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLibraries.map((lib) => (
                <LibraryCard key={lib.id} library={lib} onSelect={setSelectedLibrary} />
              ))}
            </div>

            {filteredLibraries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Библиотеки не найдены</p>
                <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'comparison' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Сравнение функционала библиотек</h2>
            <p className="text-sm text-gray-500 mb-6">
              Сравнительная таблица основных возможностей каждой библиотеки
            </p>
            <ComparisonTable />
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Итоги исследования</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🏆 Топ для Real-time данных:</h3>
              <p className="text-sm text-gray-600">
                <strong>@mathieuc/tradingview</strong> — самая полная библиотека с WebSocket поддержкой, 
                индикаторами, бэктестингом и премиум-функциями. 5.1k звёзд.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📈 Топ для скрининга:</h3>
              <p className="text-sm text-gray-600">
                <strong>tvscreener</strong> — 13,000+ полей, MCP интеграция для AI, 
                Pandas DataFrame вывод. <strong>tradingview-screener</strong> — SQL-подобный синтаксис, 3000+ полей.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📉 Топ для визуализации:</h3>
              <p className="text-sm text-gray-600">
                <strong>lightweight-charts</strong> — официальная open-source библиотека от TradingView. 
                10k+ звёзд, Apache 2.0 лицензия, высокая производительность.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">⚠️ Важно:</h3>
              <p className="text-sm text-gray-600">
                Все неофициальные библиотеки используют внутренние API TradingView и могут перестать работать 
                при изменении API. Для продакшена рекомендуется использовать официальные решения или иметь fallback.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Данные собраны из GitHub, PyPI и npm. Информация актуальна на Сентябрь 2026.</p>
          <p className="mt-1">Все библиотеки являются неофициальными (кроме lightweight-charts и Advanced Charts от TradingView).</p>
        </div>
      </footer>

      {/* Modal */}
      {selectedLibrary && (
        <LibraryModal library={selectedLibrary} onClose={() => setSelectedLibrary(null)} />
      )}
    </div>
  );
}
