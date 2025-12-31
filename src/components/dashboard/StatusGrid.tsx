'use client'

import { StatusTroca } from '@prisma/client'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface StatusCardProps {
    status: StatusTroca
    count: number
}

export function StatusCard({ status, count }: StatusCardProps) {
    const config = STATUS_CONFIG[status]

    return (
        <Link href={`/trocas?status=${status}`}>
            <Card className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
                'border-l-4',
                config.bgColor.replace('bg-', 'border-l-')
            )}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{config.label}</p>
                            <p className={cn('text-3xl font-bold', config.color)}>{count}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

interface StatusGridProps {
    stats: Record<string, number>
}

export function StatusGrid({ stats }: StatusGridProps) {
    const allStatuses = Object.keys(STATUS_CONFIG) as StatusTroca[]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {allStatuses.map((status) => (
                <StatusCard
                    key={status}
                    status={status}
                    count={stats[status] || 0}
                />
            ))}
        </div>
    )
}
