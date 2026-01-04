import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from './prisma'

/**
 * Calcula o valor total da troca a partir do orçamento
 */
export function calcularValorTotal(orcamentoValorTotal: Decimal | null): Decimal {
    if (!orcamentoValorTotal) return new Decimal(0)
    return new Decimal(orcamentoValorTotal)
}

/**
 * Calcula o valor recuperado baseado no status da troca
 */
export function calcularValorRecuperado(
    statusAtual: string,
    valorTotal: Decimal
): Decimal {
    if (statusAtual === 'TROCA_RESOLVIDA') {
        return new Decimal(valorTotal)
    }
    return new Decimal(0)
}

/**
 * Calcula o valor pendente
 */
export function calcularValorPendente(
    valorTotal: Decimal,
    valorRecuperado: Decimal
): Decimal {
    return new Decimal(valorTotal).minus(new Decimal(valorRecuperado))
}

/**
 * Atualiza os valores financeiros de uma troca
 */
export async function atualizarValoresFinanceiros(trocaId: string): Promise<void> {
    const troca = await prisma.troca.findUnique({
        where: { id: trocaId },
        include: {
            orcamento: true,
        },
    })

    if (!troca) {
        throw new Error('Troca não encontrada')
    }

    const valorTotal = calcularValorTotal(troca.orcamento?.valorTotal || null)
    const valorRecuperado = calcularValorRecuperado(troca.statusAtual, valorTotal)
    const valorPendente = calcularValorPendente(valorTotal, valorRecuperado)

    await prisma.troca.update({
        where: { id: trocaId },
        data: {
            valorTotal,
            valorRecuperado,
            valorPendente,
        },
    })
}

/**
 * Atualiza flag de alerta atrasada baseado no prazo e status
 */
export async function atualizarAlertaAtrasada(trocaId: string): Promise<void> {
    const troca = await prisma.troca.findUnique({
        where: { id: trocaId },
    })

    if (!troca) {
        throw new Error('Troca não encontrada')
    }

    const alertaAtrasada =
        troca.statusAtual !== 'TROCA_RESOLVIDA' &&
        !!troca.prazoAlertalAtual &&
        new Date() > new Date(troca.prazoAlertalAtual)

    await prisma.troca.update({
        where: { id: trocaId },
        data: {
            alertaAtrasada,
        },
    })
}
