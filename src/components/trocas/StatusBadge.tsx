'use client'

import { StatusTroca } from '@prisma/client'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
    status: StatusTroca
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status]

    return (
        <Badge
            variant="secondary"
            className={cn(
                'font-medium whitespace-nowrap',
                config.bgColor,
                config.color,
                className
            )}
        >
            {config.label}
        </Badge>
    )
}
