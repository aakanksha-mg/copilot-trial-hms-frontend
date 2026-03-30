import { createLazyFileRoute } from '@tanstack/react-router'
import ProductWeightage from '@/Pages/ProductWeightage'

export const Route = createLazyFileRoute('/_auth/search/incentive/product-weightage/')({
  component: ProductWeightage,
})
