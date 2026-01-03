'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { calcularDiasAtraso } from '@/lib/types'

interface AlertBadgeProps {
    prazoAlertalAtual: Date | string | null
    statusAtual: string
}

export function AlertBadge({ prazoAlertalAtual, statusAtual }: AlertBadgeProps) {
    // Trocas resolvidas não mostram alerta
    if (statusAtual === 'TROCA_RESOLVIDA') return null
    if (!prazoAlertalAtual) return null

    const diasAtraso = calcularDiasAtraso(prazoAlertalAtual)

    if (diasAtraso <= 0) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="destructive"
                        className="flex items-center gap-1 animate-pulse cursor-help"
                    >
                        <AlertCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Atrasada</span>
                        <Clock className="h-3 w-3 sm:hidden" />
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {diasAtraso === 1
                            ? '1 dia de atraso'
                            : `${diasAtraso} dias de atraso`}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
