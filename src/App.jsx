import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus,
  X,
  Trash2,
  RefreshCcw,
  Wallet,
  Trophy,
  AlertCircle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  List,
  Search,
  Loader2,
  TrendingUp,
  Maximize2,
  Calendar,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Banknote,
  Pencil,
  Check
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine
} from 'recharts'

// Proxy CORS pour Yahoo Finance
const CORS_PROXY = 'https://corsproxy.io/?'

// API Yahoo Finance - Recherche d'actions
const searchStocks = async (query) => {
  if (!query || query.length < 2) return []

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`)}`
    const response = await fetch(url)
    const data = await response.json()

    return (data.quotes || [])
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType
      }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

// API Yahoo Finance - Prix d'une action
const fetchStockPrice = async (symbol) => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`)}`
    const response = await fetch(url)
    const data = await response.json()

    const result = data.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      currency: meta.currency,
      name: meta.shortName || meta.longName || symbol
    }
  } catch (error) {
    console.error('Price fetch error:', error)
    return null
  }
}

// Fetch multiple stock prices
const fetchAllPrices = async (symbols) => {
  const prices = {}
  await Promise.all(
    symbols.map(async (symbol) => {
      const data = await fetchStockPrice(symbol)
      if (data) {
        prices[symbol] = data.price
      }
    })
  )
  return prices
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

// Utilitaires
const formatCurrency = (value, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(value)
}

const formatPercent = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

const formatCompactCurrency = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k€`
  return `${value.toFixed(0)}€`
}

const calculateLineValue = (qty, currentPrice) => qty * currentPrice

const calculateLinePL = (qty, pru, currentPrice) => {
  const plEuro = (currentPrice - pru) * qty
  const plPercent = pru > 0 ? ((currentPrice - pru) / pru) * 100 : 0
  return { plEuro, plPercent }
}

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Generate historical data based on positions
const generateHistoricalData = (positions, period, portfolioHistory) => {
  const now = new Date()
  let days, interval, format

  switch (period) {
    case '1W':
      days = 7
      interval = 1
      format = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short' })
      break
    case '1M':
      days = 30
      interval = 1
      format = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      break
    case '3M':
      days = 90
      interval = 3
      format = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      break
    case '6M':
      days = 180
      interval = 7
      format = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      break
    case '1Y':
      days = 365
      interval = 14
      format = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      break
    case 'ALL':
      days = 730
      interval = 30
      format = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      break
    default:
      days = 180
      interval = 7
      format = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Calculate current portfolio value
  const currentValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0)
  const totalCost = positions.reduce((sum, pos) => sum + pos.quantity * pos.pru, 0)

  // Use real history if available, otherwise simulate
  const data = []
  const numPoints = Math.floor(days / interval)

  // Create a seeded random for consistent data
  let seed = positions.reduce((acc, p) => acc + p.ticker.charCodeAt(0), 0)
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Check for real historical data points
  const historyMap = new Map()
  portfolioHistory.forEach(h => {
    const dateKey = new Date(h.date).toDateString()
    historyMap.set(dateKey, h.value)
  })

  for (let i = numPoints; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - (i * interval))
    const dateKey = date.toDateString()

    // Check if we have real data for this date
    let value
    if (historyMap.has(dateKey)) {
      value = historyMap.get(dateKey)
    } else {
      // Simulate with realistic market movement
      const progress = (numPoints - i) / numPoints
      const baseValue = totalCost + (currentValue - totalCost) * progress
      const volatility = 0.02 * (1 + seededRandom() * 0.5)
      const trend = (seededRandom() - 0.45) * volatility * baseValue
      value = Math.max(baseValue * 0.7, baseValue + trend)
    }

    // Calculate daily change
    const prevValue = data.length > 0 ? data[data.length - 1].value : value
    const change = value - prevValue
    const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0

    data.push({
      date: format(date),
      fullDate: date.toISOString(),
      value: Math.round(value * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      invested: totalCost,
      profit: Math.round((value - totalCost) * 100) / 100
    })
  }

  return data
}

// Calculate portfolio metrics
const calculateMetrics = (historyData, currentValue, totalCost) => {
  if (historyData.length < 2) return null

  const firstValue = historyData[0].value
  const lastValue = historyData[historyData.length - 1].value
  const periodReturn = ((lastValue - firstValue) / firstValue) * 100

  // Calculate volatility (standard deviation of daily returns)
  const returns = historyData.slice(1).map((d, i) => {
    const prevValue = historyData[i].value
    return prevValue > 0 ? ((d.value - prevValue) / prevValue) * 100 : 0
  })
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)

  // Find max and min
  const maxValue = Math.max(...historyData.map(d => d.value))
  const minValue = Math.min(...historyData.map(d => d.value))
  const maxDate = historyData.find(d => d.value === maxValue)?.date
  const minDate = historyData.find(d => d.value === minValue)?.date

  // Calculate max drawdown
  let maxDrawdown = 0
  let peak = historyData[0].value
  historyData.forEach(d => {
    if (d.value > peak) peak = d.value
    const drawdown = ((peak - d.value) / peak) * 100
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  })

  // Best and worst days
  const bestDay = historyData.reduce((best, d) => d.changePercent > best.changePercent ? d : best, historyData[0])
  const worstDay = historyData.reduce((worst, d) => d.changePercent < worst.changePercent ? d : worst, historyData[0])

  return {
    periodReturn,
    volatility,
    maxValue,
    minValue,
    maxDate,
    minDate,
    maxDrawdown,
    bestDay,
    worstDay,
    totalReturn: ((currentValue - totalCost) / totalCost) * 100,
    avgDailyReturn: avgReturn
  }
}

function App() {
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('pea-positions')
    return saved ? JSON.parse(saved) : []
  })
  const [portfolioHistory, setPortfolioHistory] = useState(() => {
    const saved = localStorage.getItem('pea-history')
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)
  const [chartPeriod, setChartPeriod] = useState('6M')
  const [chartType, setChartType] = useState('area')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [viewMode, setViewMode] = useState('grid')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cash balance state
  const [cashBalance, setCashBalance] = useState(() => {
    const saved = localStorage.getItem('pea-cash')
    return saved ? parseFloat(saved) : 0
  })
  const [isEditingCash, setIsEditingCash] = useState(false)
  const [editCashValue, setEditCashValue] = useState('')

  // Form state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [pru, setPru] = useState('')
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('pea-positions', JSON.stringify(positions))
  }, [positions])

  useEffect(() => {
    localStorage.setItem('pea-history', JSON.stringify(portfolioHistory))
  }, [portfolioHistory])

  useEffect(() => {
    localStorage.setItem('pea-cash', cashBalance.toString())
  }, [cashBalance])

  // Record daily portfolio value
  useEffect(() => {
    if (positions.length === 0) return

    const today = new Date().toDateString()
    const todayRecord = portfolioHistory.find(h => new Date(h.date).toDateString() === today)

    if (!todayRecord) {
      const currentValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0)
      setPortfolioHistory(prev => [...prev, { date: new Date().toISOString(), value: currentValue }])
    }
  }, [positions, portfolioHistory])

  // Search stocks
  useEffect(() => {
    const search = async () => {
      if (debouncedSearch.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      const results = await searchStocks(debouncedSearch)
      setSearchResults(results)
      setIsSearching(false)
    }

    search()
  }, [debouncedSearch])

  // Fetch current price when stock is selected
  const handleSelectStock = async (stock) => {
    setSelectedStock(stock)
    setSearchQuery(stock.name)
    setSearchResults([])
    setIsFetchingPrice(true)

    const priceData = await fetchStockPrice(stock.symbol)
    if (priceData) {
      setSelectedStock(prev => ({ ...prev, currentPrice: priceData.price, currency: priceData.currency }))
    }
    setIsFetchingPrice(false)
  }

  // Refresh all prices
  const refreshPrices = useCallback(async () => {
    if (positions.length === 0) return

    setIsRefreshing(true)
    const symbols = positions.map(p => p.ticker)
    const prices = await fetchAllPrices(symbols)

    setPositions(prev => prev.map(pos => ({
      ...pos,
      currentPrice: prices[pos.ticker] || pos.currentPrice
    })))

    setLastUpdate(new Date())
    setIsRefreshing(false)
  }, [positions])

  // Auto-refresh on mount
  useEffect(() => {
    if (positions.length > 0) {
      refreshPrices()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculs globaux
  const stats = useMemo(() => {
    let totalValue = 0
    let totalCost = 0

    positions.forEach((pos) => {
      totalValue += pos.quantity * pos.currentPrice
      totalCost += pos.quantity * pos.pru
    })

    const totalPL = totalValue - totalCost
    const totalPLPercentage = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

    return { totalValue, totalCost, totalPL, totalPLPercentage }
  }, [positions])

  // Historical data
  const historyData = useMemo(() => {
    if (positions.length === 0) return []
    return generateHistoricalData(positions, chartPeriod, portfolioHistory)
  }, [positions, chartPeriod, portfolioHistory])

  // Metrics
  const metrics = useMemo(() => {
    return calculateMetrics(historyData, stats.totalValue, stats.totalCost)
  }, [historyData, stats.totalValue, stats.totalCost])

  // Données pour le pie chart
  const pieData = useMemo(() => {
    return positions.map((p, idx) => ({
      name: p.ticker,
      value: calculateLineValue(p.quantity, p.currentPrice),
      color: COLORS[idx % COLORS.length]
    })).sort((a, b) => b.value - a.value)
  }, [positions])

  // Quick stats
  const quickStats = useMemo(() => {
    if (positions.length === 0) return null

    const analyzed = positions.map(p => ({
      ...p,
      ...calculateLinePL(p.quantity, p.pru, p.currentPrice)
    })).sort((a, b) => b.plPercent - a.plPercent)

    return {
      top: analyzed[0],
      bottom: analyzed[analyzed.length - 1],
      diversification: Math.min(positions.length * 10, 100)
    }
  }, [positions])

  // Gestion du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStock || !quantity || !pru) return

    const newPosition = {
      id: Math.random().toString(36).substr(2, 9),
      ticker: selectedStock.symbol,
      name: selectedStock.name,
      quantity: parseFloat(quantity),
      pru: parseFloat(pru),
      currentPrice: selectedStock.currentPrice || parseFloat(pru),
      currency: selectedStock.currency || 'EUR',
      addedAt: new Date().toISOString()
    }

    setPositions([...positions, newPosition])
    resetForm()
    setShowForm(false)
  }

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedStock(null)
    setQuantity('')
    setPru('')
  }

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette ligne ?')) {
      setPositions(positions.filter(pos => pos.id !== id))
    }
  }

  const handleEditCash = () => {
    setEditCashValue(cashBalance.toString())
    setIsEditingCash(true)
  }

  const handleSaveCash = () => {
    const value = parseFloat(editCashValue)
    if (!isNaN(value) && value >= 0) {
      setCashBalance(value)
    }
    setIsEditingCash(false)
  }

  const isPositive = stats.totalPL >= 0
  const periods = ['1W', '1M', '3M', '6M', '1Y', 'ALL']

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
          <p className="font-bold text-slate-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">
              Valeur: <span className="font-bold text-slate-900">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-slate-600">
              P/L: <span className={`font-bold ${data.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.profit >= 0 ? '+' : ''}{formatCurrency(data.profit)}
              </span>
            </p>
            {data.changePercent !== undefined && (
              <p className="text-slate-600">
                Var. jour: <span className={`font-bold ${data.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Render chart based on type
  const renderChart = (height = 250, showDetails = false) => {
    if (historyData.length === 0) return null

    const chartProps = {
      data: historyData,
      margin: { top: 10, right: 10, left: showDetails ? 10 : -20, bottom: 0 }
    }

    const gradientDefs = (
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
      </defs>
    )

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...chartProps}>
            {gradientDefs}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={formatCompactCurrency}
              width={showDetails ? 60 : 40}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stats.totalCost} stroke="#94a3b8" strokeDasharray="5 5" />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={formatCompactCurrency}
              width={showDetails ? 60 : 40}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stats.totalCost} stroke="#94a3b8" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="invested"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={formatCompactCurrency}
              width={showDetails ? 60 : 40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="right"
              dataKey="changePercent"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              opacity={0.6}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      {/* Header gradient fade */}
      <div className="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-[#F8FAFC] to-transparent z-40 pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 px-6 pt-12 pb-6 flex justify-between items-center max-w-2xl mx-auto">
        <div>
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Portfolio Manager</h2>
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-extrabold text-2xl tracking-tight">Tableau de Bord</span>
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          </div>
        </div>
        <button
          onClick={refreshPrices}
          disabled={isRefreshing}
          className="group p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          title="Actualiser les cours"
        >
          <RefreshCcw size={20} className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-active:rotate-180'}`} />
        </button>
      </header>

      <main className="px-6 max-w-2xl mx-auto space-y-8">
        {/* Dashboard Card */}
        <section>
          <div className="relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
            {/* Decorative Background Glow */}
            <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-[100px] opacity-20 ${
              isPositive ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <Wallet className="text-slate-600" size={20} />
                  </div>
                  <span className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Valeur du Portefeuille</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold ${
                  isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatPercent(Math.abs(stats.totalPLPercentage))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
                  {formatCurrency(stats.totalValue)}
                </h1>
                <div className="flex items-center gap-2 mt-4">
                  <div className={`flex items-center font-bold text-lg ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : '-'}{formatCurrency(Math.abs(stats.totalPL))}
                  </div>
                  <span className="text-slate-400 text-sm font-medium">Profit Latent Total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Capital Investi</p>
                  <p className="text-slate-700 font-bold">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Performance</p>
                  <p className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? 'Optimiste' : 'Sous tension'}
                  </p>
                </div>
              </div>

              {/* Cash Balance Section */}
              <div className="mt-6 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Banknote className="text-emerald-600" size={18} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-0.5">Espèces Disponibles</p>
                      {isEditingCash ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editCashValue}
                            onChange={(e) => setEditCashValue(e.target.value)}
                            className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCash()
                              if (e.key === 'Escape') setIsEditingCash(false)
                            }}
                          />
                          <button
                            onClick={handleSaveCash}
                            className="p-1 bg-emerald-100 rounded-lg text-emerald-600 hover:bg-emerald-200 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-700 font-bold">{formatCurrency(cashBalance)}</p>
                      )}
                    </div>
                  </div>
                  {!isEditingCash && (
                    <button
                      onClick={handleEditCash}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      title="Modifier le solde"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Valeur totale du compte</span>
                  <span className="font-bold text-slate-900">{formatCurrency(stats.totalValue + cashBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* History Chart */}
          {positions.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 font-bold text-lg">Évolution Portefeuille</h3>
                <button
                  onClick={() => setShowChartModal(true)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                  title="Agrandir"
                >
                  <Maximize2 size={18} />
                </button>
              </div>

              {/* Period selector */}
              <div className="flex gap-1 mb-6 bg-slate-50 p-1 rounded-xl w-fit">
                {periods.map(period => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      chartPeriod === period
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <div className="h-[250px] w-full">
                {renderChart(250, false)}
              </div>

              {/* Quick metrics */}
              {metrics && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Période</p>
                    <p className={`font-bold ${metrics.periodReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metrics.periodReturn >= 0 ? '+' : ''}{metrics.periodReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Volatilité</p>
                    <p className="font-bold text-slate-700">{metrics.volatility.toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Max Drawdown</p>
                    <p className="font-bold text-rose-600">-{metrics.maxDrawdown.toFixed(2)}%</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          {quickStats && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} className="text-amber-500" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Ligne</span>
                </div>
                <p className="font-bold text-slate-900 truncate">{quickStats.top.ticker}</p>
                <p className="text-emerald-500 text-sm font-bold">+{formatPercent(quickStats.top.plPercent)}</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-slate-400" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flop Ligne</span>
                </div>
                <p className="font-bold text-slate-900 truncate">{quickStats.bottom.ticker}</p>
                <p className={`text-sm font-bold ${quickStats.bottom.plPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {quickStats.bottom.plPercent >= 0 ? '+' : ''}{formatPercent(quickStats.bottom.plPercent)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Target size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Score Diversification</span>
                    <p className="font-bold text-slate-900">{quickStats.diversification}/100</p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${quickStats.diversification}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Analytics - Pie Chart */}
          {positions.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
              <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2">
                Allocation des Actifs
              </h3>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[200px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value.toFixed(2)}€`, 'Valeur']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-3">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700 uppercase">{item.name}</span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        {((item.value / pieData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Positions List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-slate-900 font-bold text-xl">Mes Actifs</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {positions.length}
              </span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {positions.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 font-semibold">Commencez à bâtir votre fortune</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-indigo-600 font-bold hover:text-indigo-700"
                >
                  Ajouter ma première action
                </button>
              </div>
            ) : (
              positions.map((position) => {
                const value = calculateLineValue(position.quantity, position.currentPrice)
                const { plEuro, plPercent } = calculateLinePL(position.quantity, position.pru, position.currentPrice)
                const isPosPositive = plEuro >= 0

                return (
                  <div
                    key={position.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg uppercase">{position.ticker}</h3>
                        <p className="text-slate-500 text-xs font-medium">{position.name}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(position.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Valeur</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(value, position.currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">P/L</p>
                        <p className={`text-base font-semibold ${isPosPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPosPositive ? '+' : ''}{formatPercent(plPercent)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium">{position.quantity}</span> titres à <span className="font-medium">{formatCurrency(position.pru, position.currency)}</span>
                      </div>
                      <div className={`text-xs font-bold ${isPosPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPosPositive ? '+' : ''}{formatCurrency(plEuro, position.currency)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-8 pt-4">
          <p className="text-slate-400 text-xs font-medium">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </footer>
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-lg px-2 py-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-2 pointer-events-auto border border-white/10">
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-slate-900 px-8 py-3.5 rounded-full flex items-center gap-3 font-extrabold hover:bg-slate-50 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            <span>Ajouter une ligne</span>
          </button>
          <div className="w-px h-8 bg-white/20 mx-2" />
          <div className="pr-6 pl-2 py-2">
            <span className="block text-[10px] text-slate-400 uppercase font-bold leading-none mb-1">Total</span>
            <span className="text-white font-bold text-sm tracking-tight">{formatCurrency(stats.totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Évolution du Portefeuille</h2>
                <p className="text-sm text-slate-500">Analyse détaillée</p>
              </div>
              <button
                onClick={() => setShowChartModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Controls */}
            <div className="px-6 py-4 flex flex-wrap gap-4 items-center justify-between border-b border-slate-50">
              {/* Period selector */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {periods.map(period => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      chartPeriod === period
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Chart type selector */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartType('area')}
                  className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  title="Graphique en aires"
                >
                  <Activity size={18} />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  title="Graphique en lignes"
                >
                  <TrendingUp size={18} />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  title="Graphique en barres"
                >
                  <BarChart3 size={18} />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 px-6 py-4">
              {renderChart(400, true)}
            </div>

            {/* Metrics Grid */}
            {metrics && (
              <div className="px-6 py-4 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rendement période</span>
                    </div>
                    <p className={`text-xl font-bold ${metrics.periodReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metrics.periodReturn >= 0 ? '+' : ''}{metrics.periodReturn.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-indigo-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volatilité</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{metrics.volatility.toFixed(2)}%</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight size={16} className="text-emerald-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plus haut</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(metrics.maxValue)}</p>
                    <p className="text-xs text-slate-500">{metrics.maxDate}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownRight size={16} className="text-rose-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plus bas</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(metrics.minValue)}</p>
                    <p className="text-xs text-slate-500">{metrics.minDate}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={16} className="text-rose-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Drawdown</span>
                    </div>
                    <p className="text-xl font-bold text-rose-600">-{metrics.maxDrawdown.toFixed(2)}%</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rendement total</span>
                    </div>
                    <p className={`text-xl font-bold ${metrics.totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-emerald-600" />
                      <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Meilleur jour</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">+{metrics.bestDay.changePercent.toFixed(2)}%</p>
                    <p className="text-xs text-emerald-600/70">{metrics.bestDay.date}</p>
                  </div>

                  <div className="bg-rose-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-rose-600" />
                      <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Pire jour</span>
                    </div>
                    <p className="text-xl font-bold text-rose-600">{metrics.worstDay.changePercent.toFixed(2)}%</p>
                    <p className="text-xs text-rose-600/70">{metrics.worstDay.date}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal formulaire avec recherche */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Nouvelle Position</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Stock Search */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Rechercher une action
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Ex: LVMH, Apple, CAC 40..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSelectedStock(null)
                    }}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={18} />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedStock && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => handleSelectStock(stock)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-slate-50 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">{stock.symbol}</p>
                            <p className="text-sm text-slate-500 truncate">{stock.name}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">
                            {stock.exchange}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Stock Info */}
              {selectedStock && (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{selectedStock.symbol}</p>
                      <p className="text-sm text-slate-500">{selectedStock.name}</p>
                    </div>
                    {isFetchingPrice ? (
                      <Loader2 className="text-indigo-500 animate-spin" size={20} />
                    ) : selectedStock.currentPrice ? (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Cours actuel</p>
                        <p className="font-bold text-indigo-600">
                          {formatCurrency(selectedStock.currentPrice, selectedStock.currency)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantité</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">PRU ({selectedStock?.currency || 'EUR'})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={pru}
                    onChange={(e) => setPru(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedStock || !quantity || !pru}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter au portefeuille
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
