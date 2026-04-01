import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronRight, FiCode, FiFilter, FiInfo, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SelectionExpressionBuilder from '@/components/SelectionExpressionBuilder'
import { incentiveService } from '@/services/incentiveService'
import type { IKpi, IIncentiveProgram } from '@/models/incentive'

// ─── Types ────────────────────────────────────────────────────────────────────

type KPIEntry = IKpi

interface SelectedKPI {
  kpiId: string
  weight: number
}

interface SlabState {
  id: string
  programName: string
  programDescription: string
  startDate: string
  endDate: string
  selectedKPIs: Array<SelectedKPI>
  criteriaTab: 'selected-kpi' | 'expression'
  selectionExpression: string
  incentiveExpression: string
}

// ─── Agent Filter Types ───────────────────────────────────────────────────────

interface AgentFilterState {
  channels: string[]
  subChannels: string[]
  branches: string[]
  designations: string[]
}

interface PastCycle {
  date: string
  name: string
  executionDate: string
}

// ─── Shared KPI Library (loaded from API) ────────────────────────────────────

const KPI_LIBRARY_PLACEHOLDER: KPIEntry[] = []

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

// ─── Agent Filter Mock Data ───────────────────────────────────────────────────

const CHANNELS = ['Bancassurance', 'Agency', 'Direct', 'Broker']

const SUB_CHANNELS: Record<string, string[]> = {
  Bancassurance: ['Retail Banking', 'Private Banking', 'Corporate Banking'],
  Agency: ['Individual Agent', 'Corporate Agent', 'Web Aggregator'],
  Direct: ['Online Direct', 'Telemarketing', 'Worksite'],
  Broker: ['Composite Broker', 'Direct Broker', 'Reinsurance Broker'],
}

const BRANCHES_BY_SUBCHANNEL: Record<string, string[]> = {
  'Retail Banking': ['Mumbai Central', 'Delhi Connaught', 'Bangalore MG Road', 'Chennai Anna Nagar'],
  'Private Banking': ['Mumbai Nariman', 'Delhi Golf Links', 'Hyderabad Banjara Hills'],
  'Corporate Banking': ['Mumbai BKC', 'Gurgaon Cyber City', 'Pune Magarpatta'],
  'Individual Agent': ['Ahmedabad CG Road', 'Pune FC Road', 'Kolkata Park Street', 'Jaipur MI Road'],
  'Corporate Agent': ['Noida Sector 62', 'Chennai OMR', 'Bangalore Whitefield'],
  'Web Aggregator': ['Mumbai HQ', 'Delhi HQ', 'Bangalore HQ'],
  'Online Direct': ['Pan India'],
  Telemarketing: ['Mumbai Call Center', 'Pune Call Center', 'Noida Call Center'],
  Worksite: ['Mumbai Industrial', 'Pune Industrial', 'Faridabad Industrial'],
  'Composite Broker': ['Mumbai Fort', 'Delhi Barakhamba', 'Hyderabad Begumpet'],
  'Direct Broker': ['Chennai Nungambakkam', 'Kolkata Camac Street'],
  'Reinsurance Broker': ['Mumbai Nariman Point'],
}

const DESIGNATIONS_BY_BRANCH: Record<string, string[]> = {
  'Mumbai Central': ['Sales Manager', 'Senior Agent', 'Junior Agent', 'Team Leader'],
  'Delhi Connaught': ['Sales Manager', 'Senior Agent', 'Business Development Executive'],
  'Bangalore MG Road': ['Regional Manager', 'Sales Manager', 'Senior Agent'],
  'Chennai Anna Nagar': ['Sales Manager', 'Junior Agent', 'Team Leader'],
  'Mumbai Nariman': ['Relationship Manager', 'Senior Advisor', 'Team Leader'],
  'Delhi Golf Links': ['Relationship Manager', 'Senior Advisor'],
  'Hyderabad Banjara Hills': ['Branch Manager', 'Relationship Manager', 'Senior Advisor'],
  'Mumbai BKC': ['Corporate Sales Manager', 'Key Account Manager', 'Business Analyst'],
  'Gurgaon Cyber City': ['Corporate Sales Manager', 'Key Account Manager'],
  'Pune Magarpatta': ['Branch Manager', 'Corporate Sales Manager'],
  'Ahmedabad CG Road': ['Sales Manager', 'Senior Agent', 'Junior Agent'],
  'Pune FC Road': ['Sales Manager', 'Senior Agent', 'Team Leader'],
  'Kolkata Park Street': ['Regional Manager', 'Sales Manager', 'Senior Agent'],
  'Jaipur MI Road': ['Sales Manager', 'Junior Agent'],
  'Noida Sector 62': ['Corporate Agent Manager', 'Relationship Manager'],
  'Chennai OMR': ['Corporate Agent Manager', 'Business Development Executive'],
  'Bangalore Whitefield': ['Corporate Agent Manager', 'Key Account Manager'],
  'Mumbai HQ': ['Operations Manager', 'Sales Lead', 'Technology Lead'],
  'Delhi HQ': ['Operations Manager', 'Sales Lead'],
  'Bangalore HQ': ['Operations Manager', 'Technology Lead'],
  'Pan India': ['National Sales Head', 'Regional Head', 'Zone Manager'],
  'Mumbai Call Center': ['Call Center Manager', 'Senior Executive', 'Executive'],
  'Pune Call Center': ['Call Center Manager', 'Executive'],
  'Noida Call Center': ['Call Center Manager', 'Senior Executive'],
  'Mumbai Industrial': ['Worksite Manager', 'HR Liaison', 'Sales Executive'],
  'Pune Industrial': ['Worksite Manager', 'Sales Executive'],
  'Faridabad Industrial': ['Worksite Manager', 'HR Liaison'],
  'Mumbai Fort': ['Broker Manager', 'Senior Broker', 'Broker Associate'],
  'Delhi Barakhamba': ['Broker Manager', 'Senior Broker'],
  'Hyderabad Begumpet': ['Broker Manager', 'Broker Associate'],
  'Chennai Nungambakkam': ['Broker Manager', 'Senior Broker'],
  'Kolkata Camac Street': ['Broker Manager', 'Broker Associate'],
  'Mumbai Nariman Point': ['Reinsurance Manager', 'Senior Underwriter'],
}

// ─── Utility ─────────────────────────────────────────────────────────────────

const toVarName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

// ─── Agent Filter Component ───────────────────────────────────────────────────

interface AgentFilterProps {
  filter: AgentFilterState
  onChange: (updates: Partial<AgentFilterState>) => void
  apiDesignations: Record<string, string[]>
  designationsLoading: boolean
}

const AgentFilter = ({ filter, onChange, apiDesignations, designationsLoading }: AgentFilterProps) => {
  const availableSubChannels = useMemo(() => {
    if (filter.channels.length === 0) return []
    const scSet = new Set<string>()
    filter.channels.forEach((ch) => {
      ;(SUB_CHANNELS[ch] ?? []).forEach((sc) => scSet.add(sc))
    })
    return Array.from(scSet)
  }, [filter.channels])

  const availableBranches = useMemo(() => {
    if (filter.subChannels.length === 0) return []
    const bSet = new Set<string>()
    filter.subChannels.forEach((sc) => {
      ;(BRANCHES_BY_SUBCHANNEL[sc] ?? []).forEach((b) => bSet.add(b))
    })
    return Array.from(bSet).sort()
  }, [filter.subChannels])

  const availableDesignations = useMemo(() => {
    if (filter.branches.length === 0) return []
    const desigSet = new Set<string>()
    // Prefer API-loaded designations; fall back to static mock
    filter.branches.forEach((branch) => {
      const apiDesigs = apiDesignations[branch]
      if (apiDesigs && apiDesigs.length > 0) {
        apiDesigs.forEach((d) => desigSet.add(d))
      } else {
        ;(DESIGNATIONS_BY_BRANCH[branch] ?? []).forEach((d) => desigSet.add(d))
      }
    })
    return Array.from(desigSet).sort()
  }, [filter.branches, apiDesignations])

  const toggleChannel = (ch: string) => {
    const newChannels = filter.channels.includes(ch)
      ? filter.channels.filter((c) => c !== ch)
      : [...filter.channels, ch]
    // Keep only sub-channels still available under the new channel set
    const newAvailableSC = new Set<string>()
    newChannels.forEach((c) => {
      ;(SUB_CHANNELS[c] ?? []).forEach((sc) => newAvailableSC.add(sc))
    })
    const newSubChannels = filter.subChannels.filter((sc) => newAvailableSC.has(sc))
    // Keep only branches still available under the new sub-channel set
    const newAvailableBranches = new Set<string>()
    newSubChannels.forEach((sc) => {
      ;(BRANCHES_BY_SUBCHANNEL[sc] ?? []).forEach((b) => newAvailableBranches.add(b))
    })
    const newBranches = filter.branches.filter((b) => newAvailableBranches.has(b))
    // Keep only designations still available under the new branch set
    const newAvailableDesigns = new Set<string>()
    newBranches.forEach((b) => {
      ;(DESIGNATIONS_BY_BRANCH[b] ?? []).forEach((d) => newAvailableDesigns.add(d))
    })
    const newDesignations = filter.designations.filter((d) => newAvailableDesigns.has(d))
    onChange({ channels: newChannels, subChannels: newSubChannels, branches: newBranches, designations: newDesignations })
  }

  const toggleSubChannel = (sc: string) => {
    const newSubChannels = filter.subChannels.includes(sc)
      ? filter.subChannels.filter((s) => s !== sc)
      : [...filter.subChannels, sc]
    // Keep only branches still available under the new sub-channel set
    const newAvailableBranches = new Set<string>()
    newSubChannels.forEach((s) => {
      ;(BRANCHES_BY_SUBCHANNEL[s] ?? []).forEach((b) => newAvailableBranches.add(b))
    })
    const newBranches = filter.branches.filter((b) => newAvailableBranches.has(b))
    // Keep only designations still available under the new branch set
    const newAvailableDesigns = new Set<string>()
    newBranches.forEach((b) => {
      ;(DESIGNATIONS_BY_BRANCH[b] ?? []).forEach((d) => newAvailableDesigns.add(d))
    })
    const newDesignations = filter.designations.filter((d) => newAvailableDesigns.has(d))
    onChange({ subChannels: newSubChannels, branches: newBranches, designations: newDesignations })
  }

  const toggleBranch = (branch: string) => {
    const next = filter.branches.includes(branch)
      ? filter.branches.filter((b) => b !== branch)
      : [...filter.branches, branch]
    // Remove any designations that are no longer available after branch change
    const newDesigSet = new Set<string>()
    next.forEach((b) => {
      ;(DESIGNATIONS_BY_BRANCH[b] ?? []).forEach((d) => newDesigSet.add(d))
    })
    onChange({
      branches: next,
      designations: filter.designations.filter((d) => newDesigSet.has(d)),
    })
  }

  const toggleDesignation = (desig: string) => {
    onChange({
      designations: filter.designations.includes(desig)
        ? filter.designations.filter((d) => d !== desig)
        : [...filter.designations, desig],
    })
  }

  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm">
      <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-base">Agent Filter</CardTitle>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Select channel, sub-channel, branches, and designations to determine which agents
          are eligible for this incentive program.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Channel — multi-select */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Channel <span className="text-red-500">*</span>
              {filter.channels.length > 0 && (
                <Badge className="ml-1.5 bg-orange-100 text-orange-700 text-xs">
                  {filter.channels.length} selected
                </Badge>
              )}
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-300 bg-white p-2 space-y-1.5">
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                  <Checkbox
                    checked={filter.channels.includes(ch)}
                    onCheckedChange={() => toggleChannel(ch)}
                    className="shrink-0"
                  />
                  <span className="text-xs text-neutral-700">{ch}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sub Channel — multi-select */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Sub Channel <span className="text-red-500">*</span>
              {filter.subChannels.length > 0 && (
                <Badge className="ml-1.5 bg-orange-100 text-orange-700 text-xs">
                  {filter.subChannels.length} selected
                </Badge>
              )}
            </Label>
            {filter.channels.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                Select Channel first
              </p>
            ) : availableSubChannels.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                No sub-channels available
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-300 bg-white p-2 space-y-1.5">
                {availableSubChannels.map((sc) => (
                  <label key={sc} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                    <Checkbox
                      checked={filter.subChannels.includes(sc)}
                      onCheckedChange={() => toggleSubChannel(sc)}
                      className="shrink-0"
                    />
                    <span className="text-xs text-neutral-700">{sc}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Branches */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Branches
              {filter.branches.length > 0 && (
                <Badge className="ml-1.5 bg-orange-100 text-orange-700 text-xs">
                  {filter.branches.length} selected
                </Badge>
              )}
            </Label>
            {!filter.subChannels.length ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                Select Sub Channel first
              </p>
            ) : availableBranches.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                No branches available
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-300 bg-white p-2 space-y-1.5">
                {availableBranches.map((branch) => (
                  <label key={branch} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                    <Checkbox
                      checked={filter.branches.includes(branch)}
                      onCheckedChange={() => toggleBranch(branch)}
                      className="shrink-0"
                    />
                    <span className="text-xs text-neutral-700">{branch}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Designations */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Designations
              {filter.designations.length > 0 && (
                <Badge className="ml-1.5 bg-teal-100 text-teal-700 text-xs">
                  {filter.designations.length} selected
                </Badge>
              )}
            </Label>
            {filter.branches.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                Select Branches first
              </p>
            ) : designationsLoading ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                Loading designations…
              </p>
            ) : availableDesignations.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-400">
                No designations available
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-300 bg-white p-2 space-y-1.5">
                {availableDesignations.map((desig) => (
                  <label key={desig} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                    <Checkbox
                      checked={filter.designations.includes(desig)}
                      onCheckedChange={() => toggleDesignation(desig)}
                      className="shrink-0"
                    />
                    <span className="text-xs text-neutral-700">{desig}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filter summary */}
        {(filter.channels.length > 0 || filter.branches.length > 0 || filter.designations.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            {filter.channels.map((ch) => (
              <Badge key={ch} className="bg-orange-50 text-orange-700 border border-orange-200">
                Channel: {ch}
              </Badge>
            ))}
            {filter.subChannels.map((sc) => (
              <Badge key={sc} className="bg-orange-50 text-orange-700 border border-orange-200">
                Sub-Channel: {sc}
              </Badge>
            ))}
            {filter.branches.map((b) => (
              <Badge key={b} className="bg-blue-50 text-blue-700 border border-blue-200">
                Branch: {b}
              </Badge>
            ))}
            {filter.designations.map((d) => (
              <Badge key={d} className="bg-teal-50 text-teal-700 border border-teal-200">
                {d}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Past Qualified Cycles Component ─────────────────────────────────────────

interface PastQualifiedCyclesProps {
  cycles: PastCycle[]
}

const PastQualifiedCycles = ({ cycles }: PastQualifiedCyclesProps) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm">
      <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex items-center gap-2">
          <FiInfo className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base">Past Qualified Cycles</CardTitle>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Reference list of previously qualified incentive program cycles.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {cycles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
            <FiInfo className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-500">No past qualified cycles</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              Qualified cycles will appear here once programs are completed.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Incentive Program Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Incentive Program Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Cycle Execution Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-neutral-100 transition hover:bg-neutral-50 ${
                      idx === cycles.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs font-medium text-neutral-600">
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-normal">
                        {formatDate(cycle.date)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-800">{cycle.name}</td>
                    <td className="px-4 py-3 text-xs font-medium text-neutral-600">
                      <Badge className="bg-teal-50 text-teal-700 border border-teal-200 font-normal">
                        {formatDate(cycle.executionDate)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Slab Section Component ───────────────────────────────────────────────────

interface SlabSectionProps {
  slab: SlabState
  slabNumber: number
  canRemove: boolean
  onChange: (updates: Partial<SlabState>) => void
  onRemove: () => void
  kpiLibrary: KPIEntry[]
}

const SlabSection = ({ slab, slabNumber, canRemove, onChange, onRemove, kpiLibrary }: SlabSectionProps) => {
  const expressionRef = useRef<HTMLTextAreaElement>(null)
  const [kpiSearch, setKpiSearch] = useState('')

  const filteredLibrary = useMemo(
    () =>
      kpiLibrary.filter(
        (k) =>
          !kpiSearch ||
          k.name.toLowerCase().includes(kpiSearch.toLowerCase()) ||
          k.description.toLowerCase().includes(kpiSearch.toLowerCase()),
      ),
    [kpiSearch, kpiLibrary],
  )

  const incentivePlaceholder = useMemo(() => {
    if (slab.selectedKPIs.length === 0) return 'e.g., total_premium_by_sales_personnel * 0.05'
    const firstName = kpiLibrary.find((k) => k.id === slab.selectedKPIs[0].kpiId)?.name ?? ''
    return `e.g., ${toVarName(firstName)} * 0.05`
  }, [slab.selectedKPIs, kpiLibrary])

  const kpiFields = useMemo(
      () =>
        kpiLibrary.map((kpi) => ({
          name: toVarName(kpi.name),
          label: kpi.name,
          description: kpi.description,
        })),
      [kpiLibrary],
    )

  const isKPISelected = (id: string) => slab.selectedKPIs.some((s) => s.kpiId === id)

  const toggleKPI = (id: string) => {
    onChange({
      selectedKPIs: slab.selectedKPIs.some((s) => s.kpiId === id)
        ? slab.selectedKPIs.filter((s) => s.kpiId !== id)
        : [...slab.selectedKPIs, { kpiId: id, weight: 1 }],
    })
  }

  const updateSelectedKPI = (id: string, updates: Partial<Omit<SelectedKPI, 'kpiId'>>) => {
    onChange({
      selectedKPIs: slab.selectedKPIs.map((s) => (s.kpiId === id ? { ...s, ...updates } : s)),
    })
  }

  const insertVariable = (varName: string) => {
    const textarea = expressionRef.current
    if (!textarea) {
      onChange({ incentiveExpression: slab.incentiveExpression + varName })
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue =
      slab.incentiveExpression.slice(0, start) + varName + slab.incentiveExpression.slice(end)
    onChange({ incentiveExpression: newValue })
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + varName.length
      textarea.focus()
    }, 0)
  }

  return (
    <div className="h-full bg-white">
      {/* Slab Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <h2 className="text-base font-semibold text-neutral-800">Slab {slabNumber} Configuration</h2>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* ── 1. Program Details ── */}
        <Card className="rounded-lg border border-neutral-200">
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className="text-base">Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs font-semibold text-neutral-600">Program Name *</Label>
              <Input
                label=""
                variant="outlined"
                className="mt-1"
                placeholder="e.g., Q1 2025 Sales Excellence Program"
                value={slab.programName}
                onChange={(e) => onChange({ programName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-neutral-600">Description</Label>
              <textarea
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                rows={3}
                placeholder="Describe the objectives and scope of this incentive program…"
                value={slab.programDescription}
                onChange={(e) => onChange({ programDescription: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-neutral-600">Start Date *</Label>
                <Input
                  label=""
                  variant="outlined"
                  type="date"
                  className="mt-1"
                  value={slab.startDate}
                  onChange={(e) => onChange({ startDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-neutral-600">End Date *</Label>
                <Input
                  label=""
                  variant="outlined"
                  type="date"
                  className="mt-1"
                  value={slab.endDate}
                  onChange={(e) => onChange({ endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Select KPIs for Calculation ── */}
        <Card className="rounded-lg border border-neutral-200">
          <CardHeader className="px-4 pb-2 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Select KPIs for Calculation</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Choose pre-defined KPIs to use in the incentive calculation formula.
                </p>
              </div>
              <Badge className="ml-2 bg-teal-100 text-teal-800">
                {slab.selectedKPIs.length} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Search */}
            <div className="relative mb-3">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                label=""
                variant="outlined"
                className="pl-9"
                placeholder="Search KPIs…"
                value={kpiSearch}
                onChange={(e) => setKpiSearch(e.target.value)}
              />
            </div>
            {/* KPI list */}
            <div className="space-y-2">
              {filteredLibrary.map((kpi) => {
                const selected = isKPISelected(kpi.id)
                return (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => toggleKPI(kpi.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-neutral-200 hover:border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleKPI(kpi.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-800">{kpi.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{kpi.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {kpi.dataSources.map((ds, idx) => (
                          <Badge
                            key={idx}
                            className={`text-xs ${OBJECT_COLORS[ds.object] ?? 'bg-gray-100 text-gray-700'}`}
                          >
                            {ds.object}: {ds.aggregation}({ds.field})
                          </Badge>
                        ))}
                        <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                          {TIME_WINDOW_LABELS[kpi.timeWindow] ?? kpi.timeWindow}
                        </Badge>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Filter Criteria — tabbed: Selected KPI | Selection Expression ── */}
        <Card className="rounded-lg border border-neutral-200">
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className="text-base">Filter Criteria</CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500">
              Define which sales personnel qualify for this slab. Use the{' '}
              <strong>Selected KPI</strong> tab to configure KPI weights, or switch to{' '}
              <strong>Selection Expression</strong> for advanced SQL-based filtering.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Tabs
              value={slab.criteriaTab}
              onValueChange={(v) =>
                onChange({ criteriaTab: v as SlabState['criteriaTab'] })
              }
            >
              <TabsList className="mb-4">
                <TabsTrigger value="selected-kpi" className="gap-1.5">
                  <FiInfo className="h-3.5 w-3.5" />
                  Selected KPI
                </TabsTrigger>
                <TabsTrigger value="expression" className="gap-1.5">
                  <FiFilter className="h-3.5 w-3.5" />
                  Selection Expression
                </TabsTrigger>
              </TabsList>

              {/* Tab: Selected KPI */}
              <TabsContent value="selected-kpi">
                {slab.selectedKPIs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
                    <FiInfo className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
                    <p className="text-xs text-neutral-400">
                      No KPIs selected yet. Choose from the library above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slab.selectedKPIs.map((sel, idx) => {
                      const kpi = KPI_LIBRARY.find((k) => k.id === sel.kpiId)
                      if (!kpi) return null
                      return (
                        <div key={sel.kpiId} className="space-y-2">
                          {idx > 0 && <Separator />}
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">{kpi.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {kpi.dataSources.map((ds, i) => (
                                <Badge
                                  key={i}
                                  className={`text-xs ${OBJECT_COLORS[ds.object] ?? ''}`}
                                >
                                  {ds.object}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap text-xs font-semibold text-neutral-600">
                              Weight
                            </Label>
                            <Input
                              label=""
                              variant="outlined"
                              type="number"
                              className="w-20 text-sm"
                              min={0}
                              max={100}
                              step={0.1}
                              value={sel.weight}
                              onChange={(e) =>
                                updateSelectedKPI(sel.kpiId, {
                                  weight: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                            <span className="text-xs text-neutral-500">
                              (relative weight in incentive formula)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Selection Expression */}
              <TabsContent value="expression">
                <SelectionExpressionBuilder
                  expression={slab.selectionExpression}
                  onChange={(expr) => onChange({ selectionExpression: expr })}
                  availableFields={kpiFields}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── 4. Incentive Calculation Expression ── */}
        <Card className="rounded-lg border border-neutral-200">
          <CardHeader className="px-4 pb-2 pt-4">
            <div className="flex items-center gap-2">
              <FiCode className="h-4 w-4 text-green-500" />
              <CardTitle className="text-base">Incentive Calculation</CardTitle>
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              Write a formula using KPI variables to calculate the incentive payout for
              qualifying sales personnel. Click a variable chip to insert it at the cursor
              position.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {/* Available variables */}
            <div>
              <Label className="mb-2 block text-xs font-semibold text-neutral-600">
                Available Variables
              </Label>
              {slab.selectedKPIs.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  Select KPIs above to make variables available here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slab.selectedKPIs.map((sel) => {
                    const kpi = KPI_LIBRARY.find((k) => k.id === sel.kpiId)
                    if (!kpi) return null
                    const varName = toVarName(kpi.name)
                    return (
                      <button
                        key={sel.kpiId}
                        type="button"
                        title={kpi.description}
                        onClick={() => insertVariable(varName)}
                        className="rounded border border-green-200 bg-green-50 px-2 py-1 font-mono text-xs text-green-800 transition hover:bg-green-100"
                      >
                        {varName}
                      </button>
                    )
                  })}
                </div>
              )}
              {slab.selectedKPIs.length > 0 && (
                <p className="mt-1.5 text-xs text-neutral-400">
                  Tip: Use standard arithmetic operators +&nbsp;−&nbsp;*&nbsp;/ and numeric
                  constants. Example:{' '}
                  <span className="font-mono">{incentivePlaceholder.replace('e.g., ', '')}</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Expression textarea */}
            <div>
              <Label className="mb-1 block text-xs font-semibold text-neutral-600">
                Expression *
              </Label>
              <textarea
                ref={expressionRef}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                rows={4}
                placeholder={incentivePlaceholder}
                value={slab.incentiveExpression}
                onChange={(e) => onChange({ incentiveExpression: e.target.value })}
              />
            </div>

            {/* Expression preview */}
            {slab.incentiveExpression.trim() && (
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <p className="mb-1 text-xs font-semibold text-green-700">Expression Preview:</p>
                <p className="font-mono text-sm text-green-800">{slab.incentiveExpression}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createSlab = (): SlabState => ({
  id: crypto.randomUUID(),
  programName: '',
  programDescription: '',
  startDate: '',
  endDate: '',
  selectedKPIs: [],
  criteriaTab: 'selected-kpi',
  selectionExpression: '',
  incentiveExpression: '',
})

// ─── Main Component ───────────────────────────────────────────────────────────

const IncentiveProgramConfig = () => {
  const [slabs, setSlabs] = useState<Array<SlabState>>(() => [createSlab()])
  const [activeSlabId, setActiveSlabId] = useState<string>(() => slabs[0]?.id ?? '')
  const [agentFilter, setAgentFilter] = useState<AgentFilterState>({
    channels: [],
    subChannels: [],
    branches: [],
    designations: [],
  })

  // ─── API state ───────────────────────────────────────────────────────────────
  const [kpiLibrary, setKpiLibrary] = useState<KPIEntry[]>(KPI_LIBRARY_PLACEHOLDER)
  const [pastPrograms, setPastPrograms] = useState<IIncentiveProgram[]>([])
  const [apiDesignations, setApiDesignations] = useState<Record<string, string[]>>({})
  const [designationsLoading, setDesignationsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load KPI library from API
  useEffect(() => {
    incentiveService.getKpiLibrary({ pageNumber: 1, pageSize: 200 })
      .then((result) => setKpiLibrary(result?.items ?? []))
      .catch((err) => console.error('Failed to load KPI library:', err))
  }, [])

  // Load past programs from API
  useEffect(() => {
    incentiveService.getPrograms({ pageNumber: 1, pageSize: 100 })
      .then((result) => setPastPrograms(result?.items ?? []))
      .catch((err) => console.error('Failed to load programs:', err))
  }, [])

  // Fetch designations from API when branches change
  const fetchDesignations = useCallback(async (branches: string[]) => {
    if (branches.length === 0) return
    setDesignationsLoading(true)
    try {
      const result = await incentiveService.getFilters({ branchIds: branches })
      const map: Record<string, string[]> = {}
      ;(result ?? []).forEach((item) => {
        map[item.branchId] = item.designations.map((d) => d.name)
        if (item.branchName) {
          map[item.branchName] = item.designations.map((d) => d.name)
        }
      })
      setApiDesignations(map)
    } catch (err) {
      console.error('Failed to load designations from API:', err)
    } finally {
      setDesignationsLoading(false)
    }
  }, [])

  // Re-fetch designations whenever selected branches change
  useEffect(() => {
    if (agentFilter.branches.length > 0) {
      fetchDesignations(agentFilter.branches)
    }
  }, [agentFilter.branches, fetchDesignations])

  // Derive past cycles list from loaded programs
  const pastCycles: PastCycle[] = useMemo(
    () =>
      pastPrograms
        .filter((p) => p.status?.toLowerCase() === 'completed' || new Date(p.endDate) < new Date())
        .map((p) => ({
          date: p.endDate,
          name: p.name,
          executionDate: p.createdAt ?? p.endDate,
        })),
    [pastPrograms],
  )

  const updateSlab = (id: string, updates: Partial<SlabState>) => {
    setSlabs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addSlab = () => {
    const newSlab = createSlab()
    setSlabs((prev) => [...prev, newSlab])
    setActiveSlabId(newSlab.id)
  }

  const removeSlab = (id: string) => {
    setSlabs((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (activeSlabId === id && next.length > 0) {
        setActiveSlabId(next[next.length - 1].id)
      }
      return next
    })
  }

  const activeSlab = slabs.find((s) => s.id === activeSlabId) ?? slabs[0]

  const isAllValid = slabs.every((s) => {
    if (s.programName.trim() === '' || s.startDate === '' || s.endDate === '') return false
    if (s.criteriaTab === 'expression') return s.selectionExpression.trim() !== ''
    return s.selectedKPIs.length > 0
  })

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      // Map each slab to a separate program creation request
      for (const s of slabs) {
        const filters = agentFilter.branches.length > 0
          ? agentFilter.branches.map((branchId) => ({
              branchId,
              designationIds: agentFilter.designations,
            }))
          : []
        await incentiveService.createProgram({
          name: s.programName,
          description: s.programDescription,
          startDate: s.startDate,
          endDate: s.endDate,
          filters,
          kpiWeightages: s.selectedKPIs.map((k) => ({ kpiId: k.kpiId, weight: k.weight })),
        })
      }
      setSaveSuccess(true)
      // Reload programs list
      incentiveService.getPrograms({ pageNumber: 1, pageSize: 100 })
        .then((result) => setPastPrograms(result?.items ?? []))
        .catch(() => {})
    } catch (err) {
      console.error('Failed to save program:', err)
      setSaveError('Failed to save. Please check your inputs and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-5 p-2">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Program Configuration</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure incentive slabs with agent filters, eligibility cycles, and calculation formulas.
            </p>
          </div>
          <Button
            variant="green"
            size="sm"
            disabled={!isAllValid || saving}
            icon={<FiCheck className="h-4 w-4" />}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save All Slabs'}
          </Button>
        </div>

        {/* Status messages */}
        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Program saved successfully!
          </div>
        )}

        {/* 1. Agent Filter */}
        <AgentFilter
          filter={agentFilter}
          onChange={(updates) => setAgentFilter((prev) => ({ ...prev, ...updates }))}
          apiDesignations={apiDesignations}
          designationsLoading={designationsLoading}
        />

        {/* 2. Past Qualified Cycles */}
        <PastQualifiedCycles cycles={pastCycles} />

        {/* 3. Slab Configuration — Left-Right Panel Layout */}
        <Card className="rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 pb-2 pt-5 border-b border-neutral-200">
            <CardTitle className="text-base">Slab Configuration</CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500">
              Select a slab from the left panel to configure its details on the right.
            </p>
          </CardHeader>
          <div className="flex min-h-[600px]">
            {/* Left Panel — Slab List */}
            <div className="w-52 shrink-0 border-r border-neutral-200 bg-neutral-50 flex flex-col">
              {/* Add Slab Button — at the top for easy access */}
              <div className="border-b border-neutral-200 p-3">
                <button
                  type="button"
                  onClick={addSlab}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-2 text-xs font-medium text-neutral-500 transition hover:border-teal-400 hover:text-teal-600"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  Add Slab
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {slabs.map((slab, index) => {
                  const isActive = slab.id === (activeSlab?.id ?? '')
                  const hasName = slab.programName.trim() !== ''
                  return (
                    <button
                      key={slab.id}
                      type="button"
                      onClick={() => setActiveSlabId(slab.id)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition border-l-2 ${
                        isActive
                          ? 'border-l-teal-500 bg-teal-50 font-semibold text-teal-700 shadow-sm'
                          : 'border-l-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${isActive ? 'text-teal-600' : 'text-neutral-500'}`}>
                          Slab {index + 1}
                        </p>
                        <p className={`truncate text-sm ${hasName ? 'text-neutral-800' : 'text-neutral-400 italic'}`}>
                          {hasName ? slab.programName : 'Untitled'}
                        </p>
                      </div>
                      {isActive && <FiChevronRight className="h-3.5 w-3.5 shrink-0 text-teal-500" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Panel — Active Slab Config */}
            <div className="flex-1 overflow-y-auto">
              {activeSlab ? (
                <SlabSection
                  key={activeSlab.id}
                  slab={activeSlab}
                  slabNumber={slabs.findIndex((s) => s.id === activeSlab.id) + 1}
                  canRemove={slabs.length > 1}
                  onChange={(updates) => updateSlab(activeSlab.id, updates)}
                  onRemove={() => removeSlab(activeSlab.id)}
                  kpiLibrary={kpiLibrary}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-center">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">No slab selected</p>
                    <p className="mt-1 text-xs text-neutral-400">Add a slab to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default IncentiveProgramConfig

