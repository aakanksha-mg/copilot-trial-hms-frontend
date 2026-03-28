import { useMemo, useRef, useState } from 'react'
import { FiCheck, FiCode, FiFilter, FiInfo, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SelectionExpressionBuilder from '@/components/SelectionExpressionBuilder'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIEntry {
  id: string
  name: string
  description: string
  dataSources: Array<{ object: string; aggregation: string; field: string }>
  timeWindow: string
}

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

// ─── Shared KPI Library (program-agnostic) ────────────────────────────────────

const KPI_LIBRARY: Array<KPIEntry> = [
  {
    id: 'kpi-001',
    name: 'Total Premium by Sales Personnel',
    description: 'Sums up annualized premium across all active policies per sales agent.',
    dataSources: [{ object: 'Policy', aggregation: 'SUM', field: 'Annualized Premium' }],
    timeWindow: 'PROGRAM_DURATION',
  },
  {
    id: 'kpi-002',
    name: 'Unique Policies Sold',
    description: 'Counts distinct policy IDs issued by a sales agent within the program period.',
    dataSources: [{ object: 'Policy', aggregation: 'DISTINCT_COUNT', field: 'Policy ID' }],
    timeWindow: 'PROGRAM_DURATION',
  },
  {
    id: 'kpi-003',
    name: 'Training Completion Rate',
    description: 'Average training completion percentage across mandatory training modules.',
    dataSources: [{ object: 'Training', aggregation: 'AVG', field: 'Completion %' }],
    timeWindow: 'ROLLING_WINDOW',
  },
  {
    id: 'kpi-004',
    name: 'Premium + Training Score (Composite)',
    description: 'Composite KPI combining total premium and average training score.',
    dataSources: [
      { object: 'Policy', aggregation: 'SUM', field: 'Premium Amount' },
      { object: 'Training', aggregation: 'AVG', field: 'Training Score' },
    ],
    timeWindow: 'PROGRAM_DURATION',
  },
  {
    id: 'kpi-005',
    name: 'Lead Conversion Count',
    description: 'Total number of leads converted to policies by the sales agent.',
    dataSources: [{ object: 'Sales Activity', aggregation: 'SUM', field: 'Conversion Count' }],
    timeWindow: 'CUSTOM_RANGE',
  },
  {
    id: 'kpi-006',
    name: 'Multi-Source Eligibility KPI',
    description:
      'Determines eligibility based on policy premium, training completion, and meeting count.',
    dataSources: [
      { object: 'Policy', aggregation: 'SUM', field: 'Annualized Premium' },
      { object: 'Training', aggregation: 'AVG', field: 'Completion %' },
      { object: 'Sales Activity', aggregation: 'COUNT', field: 'Meeting Count' },
    ],
    timeWindow: 'PROGRAM_DURATION',
  },
]

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

// ─── Utility ─────────────────────────────────────────────────────────────────

const toVarName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

// ─── Slab Section Component ───────────────────────────────────────────────────

interface SlabSectionProps {
  slab: SlabState
  slabNumber: number
  canRemove: boolean
  onChange: (updates: Partial<SlabState>) => void
  onRemove: () => void
}

const SlabSection = ({ slab, slabNumber, canRemove, onChange, onRemove }: SlabSectionProps) => {
  const expressionRef = useRef<HTMLTextAreaElement>(null)
  const [kpiSearch, setKpiSearch] = useState('')

  const filteredLibrary = useMemo(
    () =>
      KPI_LIBRARY.filter(
        (k) =>
          !kpiSearch ||
          k.name.toLowerCase().includes(kpiSearch.toLowerCase()) ||
          k.description.toLowerCase().includes(kpiSearch.toLowerCase()),
      ),
    [kpiSearch],
  )

  const incentivePlaceholder = useMemo(() => {
    if (slab.selectedKPIs.length === 0) return 'e.g., total_premium_by_sales_personnel * 0.05'
    const firstName = KPI_LIBRARY.find((k) => k.id === slab.selectedKPIs[0].kpiId)?.name ?? ''
    return `e.g., ${toVarName(firstName)} * 0.05`
  }, [slab.selectedKPIs])

  const kpiFields = useMemo(
      () =>
        KPI_LIBRARY.map((kpi) => ({
          name: toVarName(kpi.name),
          label: kpi.name,
          description: kpi.description,
        })),
      [],
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
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Slab Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <h2 className="text-base font-semibold text-neutral-800">Slab {slabNumber}</h2>
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

  const updateSlab = (id: string, updates: Partial<SlabState>) => {
    setSlabs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addSlab = () => {
    setSlabs((prev) => [...prev, createSlab()])
  }

  const removeSlab = (id: string) => {
    setSlabs((prev) => prev.filter((s) => s.id !== id))
  }

  const isAllValid = slabs.every((s) => {
    if (s.programName.trim() === '' || s.startDate === '' || s.endDate === '') return false
    if (s.criteriaTab === 'expression') return s.selectionExpression.trim() !== ''
    return s.selectedKPIs.length > 0
  })

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-4 p-2">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Program Configuration</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure one or more incentive slabs — each slab defines its own program details,
              KPI selection, filter criteria, and incentive calculation formula.
            </p>
          </div>
          <Button
            variant="green"
            size="sm"
            disabled={!isAllValid}
            icon={<FiCheck className="h-4 w-4" />}
            onClick={() => {
              // TODO: POST /api/programs — wire up when backend endpoint is available
              const payload = slabs.map((s) => ({
                name: s.programName,
                description: s.programDescription,
                startDate: s.startDate,
                endDate: s.endDate,
                selectedKPIs: s.selectedKPIs,
                criteriaTab: s.criteriaTab,
                selectionExpression: s.selectionExpression,
                incentiveExpression: s.incentiveExpression,
              }))
              console.info('Save Programs:', JSON.stringify(payload, null, 2))
            }}
          >
            Save All Slabs
          </Button>
        </div>

        {/* Slabs */}
        {slabs.map((slab, index) => (
          <SlabSection
            key={slab.id}
            slab={slab}
            slabNumber={index + 1}
            canRemove={slabs.length > 1}
            onChange={(updates) => updateSlab(slab.id, updates)}
            onRemove={() => removeSlab(slab.id)}
          />
        ))}

        {/* Add Slab */}
        <button
          type="button"
          onClick={addSlab}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-500 transition hover:border-teal-400 hover:text-teal-600"
        >
          <FiPlus className="h-4 w-4" />
          Add Slab
        </button>
      </div>
    </div>
  )
}

export default IncentiveProgramConfig
