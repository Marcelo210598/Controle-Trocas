import { StatusTroca, TipoCompensacao } from '@prisma/client'

// Status display names and colors for UI
export const STATUS_CONFIG: Record<StatusTroca, { label: string; color: string; bgColor: string }> = {
    ORCAMENTO: {
        label: 'Orçamento',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100'
    },
    ORCAMENTO_APROVADO: {
        label: 'Orçamento Aprovado',
        color: 'text-green-700',
        bgColor: 'bg-green-100'
    },
    RASCUNHO_NF_VALIDACAO: {
        label: 'Rascunho NF em Validação',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100'
    },
    NF_EMITIDA_AGUARDANDO_DESTINO: {
        label: 'NF Emitida / Aguardando Destino',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100'
    },
    AGUARDANDO_RETIRADA: {
        label: 'Aguardando Retirada',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100'
    },
    REPOSICAO_PARCIAL: {
        label: 'Reposição Parcial',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100'
    },
    AGUARDANDO_DESCONTO: {
        label: 'Aguardando Desconto',
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-100'
    },
    TROCA_RESOLVIDA: {
        label: 'Troca Resolvida',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100'
    },
    ITEM_DESCARTADO: {
        label: 'Item Descartado',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
    },
    PROBLEMA_DIVERGENCIA: {
        label: 'Problema / Divergência',
        color: 'text-red-700',
        bgColor: 'bg-red-100'
    },
}

export const TIPO_COMPENSACAO_CONFIG: Record<TipoCompensacao, { label: string }> = {
    REPOSICAO_PRODUTO: { label: 'Reposição de Produto' },
    DESCONTO: { label: 'Desconto em Compra Futura' },
}

// Helper functions
export function formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return 'R$ 0,00'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue)
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d)
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d)
}

// Funções para controle de prazo e alerta
export function calcularDiasAtraso(prazoAlertalAtual: Date | string | null): number {
    if (!prazoAlertalAtual) return 0
    const prazo = typeof prazoAlertalAtual === 'string' ? new Date(prazoAlertalAtual) : prazoAlertalAtual
    const hoje = new Date()
    const diffTime = hoje.getTime() - prazo.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
}

export function verificarTrocaAtrasada(
    prazoAlertalAtual: Date | string | null,
    statusAtual: string
): boolean {
    // Trocas resolvidas nunca estão atrasadas
    if (statusAtual === 'TROCA_RESOLVIDA') return false
    if (!prazoAlertalAtual) return false

    const diasAtraso = calcularDiasAtraso(prazoAlertalAtual)
    return diasAtraso > 0
}

export function calcularProximoPrazo(
    prazoAtual: Date | string,
    diasAdicionados: number
): Date {
    const prazo = typeof prazoAtual === 'string' ? new Date(prazoAtual) : new Date(prazoAtual)
    const novoPrazo = new Date(prazo)
    novoPrazo.setDate(novoPrazo.getDate() + diasAdicionados)
    return novoPrazo
}

export function calcularPrazoInicial(): Date {
    const hoje = new Date()
    const prazoInicial = new Date(hoje)
    prazoInicial.setDate(prazoInicial.getDate() + 15)
    return prazoInicial
}
