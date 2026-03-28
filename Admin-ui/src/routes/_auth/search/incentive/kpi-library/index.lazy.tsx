import { createLazyFileRoute } from '@tanstack/react-router'
import IncentiveKPILibrary from '@/Pages/IncentiveKPILibrary'

export const Route = createLazyFileRoute('/_auth/search/incentive/kpi-library/')({
  component: IncentiveKPILibrary,
})
