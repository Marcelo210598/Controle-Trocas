/**
 * Script para atualizar valores financeiros de todas as trocas existentes
 * Execute: npx tsx scripts/atualizar-valores-financeiros.ts
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

function calcularValorTotal(orcamentoValorTotal: Decimal | null): Decimal {
    if (!orcamentoValorTotal) return new Decimal(0)
    return new Decimal(orcamentoValorTotal)
}

function calcularValorRecuperado(statusAtual: string, valorTotal: Decimal): Decimal {
    if (statusAtual === 'TROCA_RESOLVIDA') {
        return new Decimal(valorTotal)
    }
    return new Decimal(0)
}

function calcularValorPendente(valorTotal: Decimal, valorRecuperado: Decimal): Decimal {
    return new Decimal(valorTotal).minus(new Decimal(valorRecuperado))
}

async function atualizarValoresFinanceiros() {
    console.log('🔄 Iniciando atualização de valores financeiros...\n')

    const trocas = await prisma.troca.findMany({
        include: {
            orcamento: true,
        },
    })

    console.log(`📊 Encontradas ${trocas.length} trocas para atualizar\n`)

    for (const troca of trocas) {
        const valorTotal = calcularValorTotal(troca.orcamento?.valorTotal || null)
        const valorRecuperado = calcularValorRecuperado(troca.statusAtual, valorTotal)
        const valorPendente = calcularValorPendente(valorTotal, valorRecuperado)

        await prisma.troca.update({
            where: { id: troca.id },
            data: {
                valorTotal,
                valorRecuperado,
                valorPendente,
            },
        })

        console.log(`✅ Troca ${troca.id.substring(0, 8)}... atualizada:`)
        console.log(`   Status: ${troca.statusAtual}`)
        console.log(`   Valor Total: R$ ${valorTotal.toString()}`)
        console.log(`   Valor Recuperado: R$ ${valorRecuperado.toString()}`)
        console.log(`   Valor Pendente: R$ ${valorPendente.toString()}\n`)
    }

    console.log('✅ Atualização concluída com sucesso!')
}

atualizarValoresFinanceiros()
    .catch((error) => {
        console.error('❌ Erro ao atualizar valores financeiros:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
