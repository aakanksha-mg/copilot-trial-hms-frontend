import { useMemo, useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { FiBookOpen, FiDownload, FiExternalLink, FiPlus, FiSearch, FiSettings, FiUpload, FiUserPlus } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { incentiveService } from '@/services/incentiveService'
import type { IIncentiveProgram } from '@/models/incentive'

const statCards = [
  { title: 'Active Plans', value: '12', delta: '+3 this month' },
  { title: 'Total Agents', value: '248', delta: '+18 this month' },
  { title: 'Pending Payouts', value: '₹4.2L', delta: '-2 this month' },
  { title: 'Avg Achievement', value: '78%', delta: '+5% this month' },
]

const monthlyPayoutData = [
  { month: 'Jan', payout: 320000 },
  { month: 'Feb', payout: 450000 },
  { month: 'Mar', payout: 390000 },
  { month: 'Apr', payout: 500000 },
  { month: 'May', payout: 420000 },
  { month: 'Jun', payout: 580000 },
]

const productIncentiveData = [
  { name: 'Life Insurance', value: 40, color: '#14b8a6' },
  { name: 'Health Insurance', value: 25, color: '#7c3aed' },
  { name: 'Motor Insurance', value: 20, color: '#f59e0b' },
  { name: 'Travel Insurance', value: 15, color: '#ef4444' },
]

const weeklyTrendData = [
  { week: 'W1', achievement: 62 },
  { week: 'W2', achievement: 70 },
  { week: 'W3', achievement: 67 },
  { week: 'W4', achievement: 76 },
  { week: 'W5', achievement: 80 },
  { week: 'W6', achievement: 74 },
]

const topPerformers = [
  { name: 'Rahul Sharma', region: 'North', achievement: '112%', amount: '₹85,000' },
  { name: 'Priya Patel', region: 'West', achievement: '108%', amount: '₹78,200' },
  { name: 'Amit Kumar', region: 'South', achievement: '103%', amount: '₹72,500' },
  { name: 'Sneha Reddy', region: 'East', achievement: '98%', amount: '₹65,000' },
]

const quickActions = [
  {
    title: 'Create Incentive Plan',
    subtitle: 'Configure a new payout plan',
    icon: FiPlus,
    to: '/search/incentive/program-config' as const,
  },
  {
    title: 'KPI Library',
    subtitle: 'Browse and manage pre-defined KPIs',
    icon: FiBookOpen,
    to: '/search/incentive/kpi-library' as const,
  },
  {
    title: 'KPI Builder',
    subtitle: 'Create a new program-agnostic KPI',
    icon: FiSettings,
    to: '/search/incentive' as const,
  },
  {
    title: 'Add Agent Target',
    subtitle: 'Assign agent-wise goals',
    icon: FiUserPlus,
    to: null,
  },
  {
    title: 'Export Incentive Data',
    subtitle: 'Download monthly payout report',
    icon: FiDownload,
    to: null,
  },
  {
    title: 'Import Payout File',
    subtitle: 'Upload processed payout file',
    icon: FiUpload,
    to: null,
  },
]

const resourceItems = [
  { title: 'Incentive Policy', link: '#' },
  { title: 'Payout Rulebook', link: '#' },
  { title: 'Approval Workflow', link: '#' },
  { title: 'Incentive Master Setup', link: '#' },
  { title: 'Exception Handling Guide', link: '#' },
]

const goToItems = [
  { title: 'Payout Config', link: '#' },
  { title: 'Incentive Cycles', link: '#' },
  { title: 'Approval Queue', link: '#' },
]

const IncentiveDashboard = () => {
  const [resourceSearch, setResourceSearch] = useState('')
  const [programs, setPrograms] = useState<IIncentiveProgram[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)

  useEffect(() => {
    const fetchPrograms = async () => {
      setProgramsLoading(true)
      try {
        const result = await incentiveService.getPrograms({ pageNumber: 1, pageSize: 100 })
        setPrograms(result?.items ?? [])
      } catch (err) {
        console.error('Failed to load programs:', err)
      } finally {
        setProgramsLoading(false)
      }
    }
    fetchPrograms()
  }, [])

  const activePlansCount = programs.filter((p) => p.status?.toLowerCase() === 'active').length
  const dynamicStatCards = [
    {
      title: 'Active Plans',
      value: programsLoading ? '…' : String(activePlansCount),
      delta: `${programs.length} total programs`,
    },
    { title: 'Total Agents', value: '248', delta: '+18 this month' },
    { title: 'Pending Payouts', value: '₹4.2L', delta: '-2 this month' },
    { title: 'Avg Achievement', value: '78%', delta: '+5% this month' },
  ]

  const filteredResources = useMemo(
    () =>
      resourceItems.filter((item) =>
        item.title.toLowerCase().includes(resourceSearch.toLowerCase()),
      ),
    [resourceSearch],
  )

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full p-2">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {/* <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1> */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dynamicStatCards.map((card) => (
                <Card key={card.title} className="gap-2 rounded-lg border border-neutral-200 py-4 shadow-sm">
                  <CardContent className="px-4">
                    <p className="text-sm text-neutral-500">{card.title}</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-900">{card.value}</p>
                    <p className="mt-1 text-xs text-emerald-600">{card.delta}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="rounded-lg border border-neutral-200 py-4">
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="text-base">Monthly Payouts</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPayoutData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      <Bar dataKey="payout" radius={[6, 6, 0, 0]} fill="#14b8a6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-neutral-200 py-4">
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="text-base">Incentive by Product</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productIncentiveData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {productIncentiveData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="rounded-lg border border-neutral-200 py-4">
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="text-base">Weekly Achievement Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[260px] px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrendData}>
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Line
                        type="monotone"
                        dataKey="achievement"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-neutral-200 py-4">
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="text-base">Top Performers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4">
                  {topPerformers.map((performer) => (
                    <div
                      key={performer.name}
                      className="rounded-md border border-neutral-200 bg-neutral-100 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{performer.name}</p>
                          <p className="text-xs text-neutral-500">{performer.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">{performer.achievement}</p>
                          <p className="text-xs text-neutral-500">{performer.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="w-full xl:max-w-[22rem] space-y-3">
            <Card className="rounded-md gap-0 py-3">
              <CardHeader className="px-4">
                <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                {quickActions.map((item) => {
                  const Icon = item.icon
                  const inner = (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-700 text-gray-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      </div>
                    </>
                  )
                  const className =
                    'flex w-full items-center gap-3 rounded-md border border-gray-100 bg-gray-100 p-3 text-left transition hover:bg-white hover:shadow-sm'
                  if (item.to) {
                    return (
                      <Link key={item.title} to={item.to} className={className}>
                        {inner}
                      </Link>
                    )
                  }
                  return (
                    <button key={item.title} type="button" className={className}>
                      {inner}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="rounded-md gap-0 py-3">
              <CardHeader className="px-4">
                <CardTitle className="text-xl font-semibold">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    label=""
                    variant="searchVariant"
                    className="pl-10"
                    placeholder="Search"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredResources.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg bg-gray-100 p-3 text-left transition hover:bg-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-700">{item.title}</span>
                      <FiExternalLink className="text-gray-500" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md gap-0 py-3">
              <CardHeader className="px-4">
                <CardTitle className="text-xl font-semibold">Go To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                {goToItems.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg bg-gray-100 p-3 text-left transition hover:bg-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-700">{item.title}</span>
                    <FiExternalLink className="text-gray-500" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncentiveDashboard
