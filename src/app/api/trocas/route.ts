import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { StatusTroca, TipoCompensacao } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') as StatusTroca | null
        const fornecedorId = searchParams.get('fornecedorId')
        const dataInicio = searchParams.get('dataInicio')
        const dataFim = searchParams.get('dataFim')

        const where: Record<string, unknown> = {}

        if (status) {
            where.statusAtual = status
        }

        if (fornecedorId) {
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

        return NextResponse.json(trocas)
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

        const troca = await prisma.troca.create({
            data: {
                fornecedorId,
                tipoCompensacao: tipoCompensacao as TipoCompensacao | undefined,
                statusAtual: 'ORCAMENTO',
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
