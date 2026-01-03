import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const periodo = searchParams.get('periodo') // 'mes' ou 'ano'
        const mes = searchParams.get('mes') // 1-12
        const ano = searchParams.get('ano') // YYYY

        let dataInicio: Date | undefined
        let dataFim: Date | undefined

        // Filtro por período
        if (periodo === 'mes' && mes && ano) {
            dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1)
            dataFim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)
        } else if (periodo === 'ano' && ano) {
            dataInicio = new Date(parseInt(ano), 0, 1)
            dataFim = new Date(parseInt(ano), 11, 31, 23, 59, 59)
        }

        const where: Record<string, unknown> = {}
        if (dataInicio && dataFim) {
            where.createdAt = {
                gte: dataInicio,
                lte: dataFim,
            }
        }

        const [trocasResolvidas, trocasEmProcesso] = await Promise.all([
            // Trocas resolvidas
            prisma.troca.findMany({
                where: {
                    ...where,
                    statusAtual: 'TROCA_RESOLVIDA',
                },
                select: {
                    valorTotal: true,
                    valorRecuperado: true,
                },
            }),
            // Trocas em processo
            prisma.troca.findMany({
                where: {
                    ...where,
                    statusAtual: { not: 'TROCA_RESOLVIDA' },
                },
                select: {
                    valorTotal: true,
                    valorPendente: true,
                },
            }),
        ])

        // Somar valores
        const valorRecuperado = trocasResolvidas.reduce(
            (sum, troca) => sum + Number(troca.valorRecuperado),
            0
        )

        const valorEmProcesso = trocasEmProcesso.reduce(
            (sum, troca) => sum + Number(troca.valorTotal),
            0
        )

        const totalGeral = valorRecuperado + valorEmProcesso

        return NextResponse.json({
            valorRecuperado,
            valorEmProcesso,
            totalGeral,
            quantidadeResolvidas: trocasResolvidas.length,
            quantidadeEmProcesso: trocasEmProcesso.length,
            periodo: periodo || 'total',
            mes: mes || null,
            ano: ano || null,
        })
    } catch (error) {
        console.error('Error fetching financial stats:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas financeiras' },
            { status: 500 }
        )
    }
}
