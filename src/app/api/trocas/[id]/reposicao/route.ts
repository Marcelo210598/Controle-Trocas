import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const reposicao = await prisma.reposicao.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(reposicao)
    } catch (error) {
        console.error('Error fetching reposicao:', error)
        return NextResponse.json({ error: 'Erro ao buscar reposição' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { nfEntrada, valorAcordado, valorRecebido, dataChegada } = body

        const reposicao = await prisma.reposicao.create({
            data: {
                trocaId: id,
                nfEntrada,
                valorAcordado,
                valorRecebido,
                dataChegada: dataChegada ? new Date(dataChegada) : new Date(),
                reposicaoCompleta: valorRecebido >= valorAcordado,
            },
        })

        // Update status based on completion
        const newStatus = valorRecebido >= valorAcordado ? 'TROCA_RESOLVIDA' : 'REPOSICAO_PARCIAL'
        await prisma.troca.update({
            where: { id },
            data: {
                tipoCompensacao: 'REPOSICAO_PRODUTO',
                statusAtual: newStatus,
                historico: {
                    create: {
                        campo: 'statusAtual',
                        valorAntigo: null,
                        valorNovo: newStatus,
                    },
                },
            },
        })

        return NextResponse.json(reposicao, { status: 201 })
    } catch (error) {
        console.error('Error creating reposicao:', error)
        return NextResponse.json({ error: 'Erro ao registrar reposição' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { nfEntrada, valorRecebido, dataChegada, reposicaoCompleta } = body

        const existing = await prisma.reposicao.findUnique({ where: { trocaId: id } })
        if (!existing) {
            return NextResponse.json({ error: 'Reposição não encontrada' }, { status: 404 })
        }

        const reposicao = await prisma.reposicao.update({
            where: { trocaId: id },
            data: {
                nfEntrada,
                valorRecebido,
                dataChegada: dataChegada ? new Date(dataChegada) : undefined,
                reposicaoCompleta,
            },
        })

        // Update status if now complete
        if (reposicaoCompleta) {
            await prisma.troca.update({
                where: { id },
                data: {
                    statusAtual: 'TROCA_RESOLVIDA',
                    historico: {
                        create: {
                            campo: 'statusAtual',
                            valorAntigo: 'REPOSICAO_PARCIAL',
                            valorNovo: 'TROCA_RESOLVIDA',
                        },
                    },
                },
            })
        }

        return NextResponse.json(reposicao)
    } catch (error) {
        console.error('Error updating reposicao:', error)
        return NextResponse.json({ error: 'Erro ao atualizar reposição' }, { status: 500 })
    }
}
