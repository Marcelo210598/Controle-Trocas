import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { StatusTroca, TipoCompensacao } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const fornecedorId = searchParams.get('fornecedorId')
        const dataInicio = searchParams.get('dataInicio')
        const dataFim = searchParams.get('dataFim')
        const filtroEspecial = searchParams.get('filtroEspecial') // 'atrasadas', 'em_andamento', 'resolvidas'

        const where: Record<string, unknown> = {}

        // Filtros especiais
        if (filtroEspecial === 'atrasadas') {
            where.alertaAtrasada = true
        } else if (filtroEspecial === 'em_andamento') {
            where.statusAtual = { not: 'TROCA_RESOLVIDA' }
        } else if (filtroEspecial === 'resolvidas') {
            where.statusAtual = 'TROCA_RESOLVIDA'
        }

        if (status && status !== 'all') {
            where.statusAtual = status as StatusTroca
        }

        if (fornecedorId && fornecedorId !== 'all') {
            where.fornecedorId = fornecedorId
        }

        if (dataInicio || dataFim) {
            where.createdAt = {}
            if (dataInicio) {
                (where.createdAt as Record<string, unknown>).gte = new Date(dataInicio)
            }
            if (dataFim) {
                (where.createdAt as Record<string, unknown>).lte = new Date(dataFim)
            }
        }

        const trocas = await prisma.troca.findMany({
            where,
            include: {
                fornecedor: true,
                itens: true,
                orcamento: true,
            },
            orderBy: { updatedAt: 'desc' },
        })

        // Calcular alertaAtrasada para cada troca
        const trocasComAlerta = trocas.map((troca) => {
            const alertaAtrasada =
                troca.statusAtual !== 'TROCA_RESOLVIDA' &&
                troca.prazoAlertalAtual &&
                new Date() > new Date(troca.prazoAlertalAtual)

            return {
                ...troca,
                alertaAtrasada,
            }
        })

        return NextResponse.json(trocasComAlerta)
    } catch (error) {
        console.error('Error fetching trocas:', error)
        return NextResponse.json({ error: 'Erro ao buscar trocas' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { fornecedorId, tipoCompensacao, itens, orcamento } = body

        if (!fornecedorId) {
            return NextResponse.json({ error: 'Fornecedor é obrigatório' }, { status: 400 })
        }

        if (!itens || itens.length === 0) {
            return NextResponse.json({ error: 'Pelo menos um item é obrigatório' }, { status: 400 })
        }

        // Calcular prazo inicial de alerta (15 dias)
        const prazoInicial = new Date()
        prazoInicial.setDate(prazoInicial.getDate() + 15)

        // Calcular valor total
        const valorTotal = orcamento?.valorTotal || 0

        const troca = await prisma.troca.create({
            data: {
                fornecedorId,
                tipoCompensacao: tipoCompensacao as TipoCompensacao | undefined,
                statusAtual: 'ORCAMENTO',
                prazoAlertalAtual: prazoInicial,
                alertaAtrasada: false,
                valorTotal,
                valorRecuperado: 0,
                valorPendente: valorTotal,
                itens: {
                    create: itens.map((item: { codigoItem: string; descricao: string; quantidade: number; valorUnitario: number }) => ({
                        codigoItem: item.codigoItem,
                        descricao: item.descricao,
                        quantidade: item.quantidade,
                        valorUnitario: item.valorUnitario,
                        valorTotal: item.quantidade * item.valorUnitario,
                    })),
                },
                orcamento: orcamento
                    ? {
                        create: {
                            valorTotal: orcamento.valorTotal,
                            enviadoFornecedor: orcamento.enviadoFornecedor || false,
                        },
                    }
                    : undefined,
                historico: {
                    create: {
                        campo: 'statusAtual',
                        valorAntigo: null,
                        valorNovo: 'ORCAMENTO',
                    },
                },
            },
            include: {
                fornecedor: true,
                itens: true,
                orcamento: true,
            },
        })

        return NextResponse.json(troca, { status: 201 })
    } catch (error) {
        console.error('Error creating troca:', error)
        return NextResponse.json({ error: 'Erro ao criar troca' }, { status: 500 })
    }
}
