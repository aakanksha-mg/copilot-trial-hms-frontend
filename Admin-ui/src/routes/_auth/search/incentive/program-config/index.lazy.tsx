import { createLazyFileRoute } from '@tanstack/react-router'
import IncentiveProgramConfig from '@/Pages/IncentiveProgramConfig'

export const Route = createLazyFileRoute('/_auth/search/incentive/program-config/')({
  component: IncentiveProgramConfig,
})
