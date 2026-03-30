import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { incentiveService } from '@/services/incentiveService'
import type { IKpi } from '@/models/incentive'

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedKPI = IKpi

// ─── Object color mapping ─────────────────────────────────────────────────────

const OBJECT_COLORS: Record<string, string> = {
  Policy: 'bg-teal-100 text-teal-800',
  Training: 'bg-purple-100 text-purple-800',
  'Sales Activity': 'bg-amber-100 text-amber-800',
}

const TIME_WINDOW_LABELS: Record<string, string> = {
  PROGRAM_DURATION: 'Program Duration',
  CUSTOM_RANGE: 'Custom Range',
  ROLLING_WINDOW: 'Rolling Window',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  kpi,
  onDelete,
}: {
  kpi: SavedKPI
  onDelete: (id: string) => void
}) {
  return (
    <Card className="rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-neutral-900 truncate">
              {kpi.name}
            </CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{kpi.description}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
              aria-label="View KPI"
            >
              <FiEye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition"
              aria-label="Edit KPI"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(kpi.id)}
              className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition"
              aria-label="Delete KPI"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {/* Data sources */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-neutral-500">Data Sources</p>
          <div className="space-y-1">
            {kpi.dataSources.map((ds, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5 text-xs"
              >
                <Badge className={`shrink-0 text-xs ${OBJECT_COLORS[ds.object] ?? 'bg-gray-100 text-gray-700'}`}>
                  {ds.object}
                </Badge>
                <span className="font-mono text-neutral-700">
                  {ds.aggregation}({ds.field})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
            {TIME_WINDOW_LABELS[kpi.timeWindow] ?? kpi.timeWindow}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
            Group: {kpi.groupBy.join(', ')}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-xs text-neutral-400">
          <span>By {kpi.createdBy}</span>
          <span>{kpi.createdAt}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const IncentiveKPILibrary = () => {
  const [kpis, setKpis] = useState<SavedKPI[]>([])
  const [search, setSearch] = useState('')
  const [objectFilter, setObjectFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKpis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await incentiveService.getKpiLibrary({
        search: search || undefined,
        pageNumber: 1,
        pageSize: 100,
      })
      setKpis(result?.items ?? [])
    } catch (err) {
      console.error('Failed to fetch KPIs:', err)
      setError('Failed to load KPIs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  const filteredKpis = useMemo(() => {
    return kpis.filter((kpi) => {
      const matchesSearch =
        !search ||
        kpi.name.toLowerCase().includes(search.toLowerCase()) ||
        kpi.description.toLowerCase().includes(search.toLowerCase())
      const matchesObject =
        objectFilter === 'all' ||
        kpi.dataSources.some((ds) => ds.object.toLowerCase().replace(' ', '_') === objectFilter)
      return matchesSearch && matchesObject
    })
  }, [kpis, search, objectFilter])

  const handleDelete = async (id: string) => {
    try {
      await incentiveService.deleteKpi(id)
      setKpis((prev) => prev.filter((k) => k.id !== id))
    } catch (err) {
      console.error('Failed to delete KPI:', err)
    }
  }

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-4 p-2">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">KPI Library</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Pre-defined, program-agnostic KPIs available for use in any incentive program
            </p>
          </div>
          <Link to="/search/incentive">
            <Button variant="green" size="sm" icon={<FiPlus className="h-4 w-4" />}>
              Create New KPI
            </Button>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total KPIs', value: kpis.length },
            {
              label: 'Policy-based',
              value: kpis.filter((k) => k.dataSources.some((d) => d.object === 'Policy')).length,
            },
            {
              label: 'Training-based',
              value: kpis.filter((k) => k.dataSources.some((d) => d.object === 'Training')).length,
            },
            {
              label: 'Multi-source',
              value: kpis.filter((k) => k.dataSources.length > 1).length,
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="rounded-lg border border-neutral-200 py-3 shadow-sm"
            >
              <CardContent className="px-4">
                <p className="text-xs text-neutral-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              label=""
              variant="outlined"
              className="pl-9"
              placeholder="Search by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'policy', label: 'Policy' },
              { value: 'training', label: 'Training' },
              { value: 'sales_activity', label: 'Sales Activity' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setObjectFilter(f.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  objectFilter === f.value
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* KPI Grid */}
        {loading ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
            <p className="text-sm text-neutral-400">Loading KPIs…</p>
          </div>
        ) : filteredKpis.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
            <p className="text-sm text-neutral-400">No KPIs match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredKpis.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IncentiveKPILibrary
