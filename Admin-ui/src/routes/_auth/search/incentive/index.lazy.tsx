import { createLazyFileRoute } from '@tanstack/react-router'
import IncentiveKPIBuilder from '@/Pages/IncentiveKPIBuilder'

export const Route = createLazyFileRoute('/_auth/search/incentive/')({
  component: IncentiveKPIBuilder,
})
