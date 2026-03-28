import { useMemo, useRef, useState } from 'react'
import { FiCheck, FiCode, FiInfo, FiSearch } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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

// ─── Main Component ───────────────────────────────────────────────────────────

const IncentiveProgramConfig = () => {
  // Program fields
  const [programName, setProgramName] = useState('')
  const [programDescription, setProgramDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Selection expression (ANSI SQL WHERE clause)
  const [selectionExpression, setSelectionExpression] = useState('')

  // Calculation KPI selection
  const [selectedKPIs, setSelectedKPIs] = useState<Array<SelectedKPI>>([])
  const [kpiSearch, setKpiSearch] = useState('')
  const [incentiveExpression, setIncentiveExpression] = useState('')
  const expressionRef = useRef<HTMLTextAreaElement>(null)

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

  // Available fields for the selection expression builder (derived from KPI library)
  const kpiFields = useMemo(
    () =>
      KPI_LIBRARY.map((kpi) => ({
        name: toVarName(kpi.name),
        label: kpi.name,
        description: kpi.description,
      })),
    [],
  )

  const isKPISelected = (id: string) => selectedKPIs.some((s) => s.kpiId === id)

  const toggleKPI = (id: string) => {
    setSelectedKPIs((prev) =>
      prev.some((s) => s.kpiId === id)
        ? prev.filter((s) => s.kpiId !== id)
        : [...prev, { kpiId: id, weight: 1 }],
    )
  }

  const updateSelectedKPI = (id: string, updates: Partial<Omit<SelectedKPI, 'kpiId'>>) => {
    setSelectedKPIs((prev) =>
      prev.map((s) => (s.kpiId === id ? { ...s, ...updates } : s)),
    )
  }

  const toVarName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  const insertVariable = (varName: string) => {
    const textarea = expressionRef.current
    if (!textarea) {
      setIncentiveExpression((prev) => prev + varName)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue =
      incentiveExpression.slice(0, start) + varName + incentiveExpression.slice(end)
    setIncentiveExpression(newValue)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + varName.length
      textarea.focus()
    }, 0)
  }

  const isSaveValid =
    programName.trim() !== '' &&
    startDate !== '' &&
    endDate !== '' &&
    selectionExpression.trim() !== '' &&
    (selectedKPIs.length === 0 || incentiveExpression.trim() !== '')

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-4 p-2">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Program Configuration</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure an incentive program — define selection criteria with an SQL expression
              and optionally pick KPIs for incentive calculation
            </p>
          </div>
          <Button
            variant="green"
            size="sm"
            disabled={!isSaveValid}
            icon={<FiCheck className="h-4 w-4" />}
            onClick={() => {
              // TODO: POST /api/programs — wire up when backend endpoint is available
              const payload = {
                name: programName,
                description: programDescription,
                startDate,
                endDate,
                selectionExpression,
                calculationKPIs: selectedKPIs,
                incentiveExpression,
              }
              console.info('Save Program:', JSON.stringify(payload, null, 2))
            }}
          >
            Save Program
          </Button>
        </div>

        {/* ── Selection Expression Builder ── */}
        <SelectionExpressionBuilder
          expression={selectionExpression}
          onChange={setSelectionExpression}
          availableFields={kpiFields}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* ── LEFT: Program Details + KPI Library ── */}
          <div className="space-y-4 xl:col-span-2">
            {/* Program Details */}
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
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-neutral-600">Description</Label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    rows={3}
                    placeholder="Describe the objectives and scope of this incentive program…"
                    value={programDescription}
                    onChange={(e) => setProgramDescription(e.target.value)}
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
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-neutral-600">End Date *</Label>
                    <Input
                      label=""
                      variant="outlined"
                      type="date"
                      className="mt-1"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Library — Calculation */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Select KPIs for Calculation</CardTitle>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Choose pre-defined KPIs to use in the incentive calculation formula.
                      These KPIs are independent of the selection expression above.
                    </p>
                  </div>
                  <Badge className="ml-2 bg-teal-100 text-teal-800">
                    {selectedKPIs.length} selected
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800">{kpi.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{kpi.description}</p>
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
          </div>

          {/* ── RIGHT: Selected KPIs Configuration ── */}
          <div className="space-y-4">
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-base">Selected KPIs</CardTitle>
                <p className="text-xs text-neutral-500">
                  Configure the role and weight of each selected KPI
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {selectedKPIs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
                    <FiInfo className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
                    <p className="text-xs text-neutral-400">
                      No KPIs selected yet. Choose from the library on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedKPIs.map((sel, idx) => {
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

                          {/* Weight */}
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
              </CardContent>
            </Card>

            {/* Summary */}
            {selectedKPIs.length > 0 && (
              <Card className="rounded-lg border border-neutral-200 bg-neutral-50">
                <CardHeader className="px-4 pb-2 pt-4">
                  <CardTitle className="text-sm text-neutral-700">Program Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-4 text-xs text-neutral-600">
                  <p>
                    <span className="font-semibold">Name:</span>{' '}
                    {programName || <span className="italic text-neutral-400">not set</span>}
                  </p>
                  <p>
                    <span className="font-semibold">Period:</span>{' '}
                    {startDate && endDate
                      ? `${startDate} → ${endDate}`
                      : <span className="italic text-neutral-400">not set</span>}
                  </p>
                  <p>
                    <span className="font-semibold">Calculation KPIs:</span> {selectedKPIs.length}
                  </p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {selectedKPIs.map((sel) => {
                      const kpi = KPI_LIBRARY.find((k) => k.id === sel.kpiId)
                      return (
                        <li key={sel.kpiId}>
                          {kpi?.name}
                          <span className="ml-1 text-neutral-400">×{sel.weight}</span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Incentive Calculation Expression ── */}
        {selectedKPIs.length > 0 && (
          <Card className="rounded-lg border border-neutral-200">
            <CardHeader className="px-4 pb-2 pt-4">
              <div className="flex items-center gap-2">
                <FiCode className="h-4 w-4 text-green-500" />
                <CardTitle className="text-base">Incentive Calculation Expression</CardTitle>
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
                <div className="flex flex-wrap gap-2">
                  {selectedKPIs.map((sel) => {
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
                <p className="mt-1.5 text-xs text-neutral-400">
                  Tip: Use standard arithmetic operators +&nbsp;−&nbsp;*&nbsp;/ and numeric
                  constants. Example:{' '}
                  <span className="font-mono">
                    {toVarName(
                      KPI_LIBRARY.find((k) => k.id === selectedKPIs[0]?.kpiId)?.name ?? '',
                    )}{' '}
                    * 0.05
                  </span>
                </p>
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
                  placeholder={`e.g., ${toVarName(KPI_LIBRARY.find((k) => k.id === selectedKPIs[0]?.kpiId)?.name ?? '')} * 0.05`}
                  value={incentiveExpression}
                  onChange={(e) => setIncentiveExpression(e.target.value)}
                />
              </div>

              {/* Expression preview */}
              {incentiveExpression.trim() && (
                <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-green-700">
                    Expression Preview:
                  </p>
                  <p className="font-mono text-sm text-green-800">{incentiveExpression}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default IncentiveProgramConfig
