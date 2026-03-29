'use client'

import dynamic from 'next/dynamic'

const PlanPageClient = dynamic(
  () => import('./PlanPageClient'),
  { ssr: false }
)

export default function PlanPage() {
  return <PlanPageClient />
}