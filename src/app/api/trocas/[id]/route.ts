import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { StatusTroca, TipoCompensacao } from '@prisma/client'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const troca = await prisma.troca.findUnique({
            where: { id },
            include: {
                fornecedor: true,
                itens: true,
                orcamento: true,
                rascunhoNF: true,
                nfDevolucao: true,
                destinoItem: true,
                reposicao: true,
                desconto: true,
                historico: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!troca) {
            return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
        }

        return NextResponse.json(troca)
    } catch (error) {
        console.error('Error fetching troca:', error)
        return NextResponse.json({ error: 'Erro ao buscar troca' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { statusAtual, tipoCompensacao } = body

        const existingTroca = await prisma.troca.findUnique({ where: { id } })
        if (!existingTroca) {
            return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = {}
        const historyRecords: { campo: string; valorAntigo: string | null; valorNovo: string }[] = []

        if (statusAtual && statusAtual !== existingTroca.statusAtual) {
            updateData.statusAtual = statusAtual as StatusTroca
            historyRecords.push({
                campo: 'statusAtual',
                valorAntigo: existingTroca.statusAtual,
                valorNovo: statusAtual,
            })
        }

        if (tipoCompensacao && tipoCompensacao !== existingTroca.tipoCompensacao) {
            updateData.tipoCompensacao = tipoCompensacao as TipoCompensacao
            historyRecords.push({
                campo: 'tipoCompensacao',
                valorAntigo: existingTroca.tipoCompensacao,
                valorNovo: tipoCompensacao,
            })
        }

        const troca = await prisma.troca.update({
            where: { id },
            data: {
                ...updateData,
                historico: historyRecords.length > 0
                    ? { create: historyRecords }
                    : undefined,
            },
            include: {
                fornecedor: true,
                itens: true,
                orcamento: true,
                rascunhoNF: true,
                nfDevolucao: true,
                destinoItem: true,
                reposicao: true,
                desconto: true,
                historico: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        return NextResponse.json(troca)
    } catch (error) {
        console.error('Error updating troca:', error)
        return NextResponse.json({ error: 'Erro ao atualizar troca' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.troca.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting troca:', error)
        return NextResponse.json({ error: 'Erro ao deletar troca' }, { status: 500 })
    }
}
