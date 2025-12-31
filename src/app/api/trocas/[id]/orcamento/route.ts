import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const orcamento = await prisma.orcamento.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(orcamento)
    } catch (error) {
        console.error('Error fetching orcamento:', error)
        return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { valorTotal, enviadoFornecedor } = body

        const orcamento = await prisma.orcamento.upsert({
            where: { trocaId: id },
            update: { valorTotal, enviadoFornecedor },
            create: {
                trocaId: id,
                valorTotal,
                enviadoFornecedor: enviadoFornecedor || false,
            },
        })

        // Update troca updatedAt
        await prisma.troca.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(orcamento)
    } catch (error) {
        console.error('Error creating/updating orcamento:', error)
        return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { aprovado, enviadoFornecedor, dataEnvio } = body

        const orcamento = await prisma.orcamento.update({
            where: { trocaId: id },
            data: {
                aprovado,
                enviadoFornecedor,
                dataEnvio: dataEnvio ? new Date(dataEnvio) : undefined,
            },
        })

        // If approved, update troca status
        if (aprovado) {
            await prisma.troca.update({
                where: { id },
                data: {
                    statusAtual: 'ORCAMENTO_APROVADO',
                    historico: {
                        create: {
                            campo: 'statusAtual',
                            valorAntigo: 'ORCAMENTO',
                            valorNovo: 'ORCAMENTO_APROVADO',
                        },
                    },
                },
            })
        }

        return NextResponse.json(orcamento)
    } catch (error) {
        console.error('Error updating orcamento:', error)
        return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 })
    }
}
