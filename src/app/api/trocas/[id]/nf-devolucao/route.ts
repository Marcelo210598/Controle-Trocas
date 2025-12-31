import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const nfDevolucao = await prisma.nFDevolucao.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(nfDevolucao)
    } catch (error) {
        console.error('Error fetching NF devolução:', error)
        return NextResponse.json({ error: 'Erro ao buscar NF devolução' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { numeroNF, valorNF } = body

        const nfDevolucao = await prisma.nFDevolucao.create({
            data: {
                trocaId: id,
                nfEmitida: true,
                numeroNF,
                dataEmissao: new Date(),
                valorNF,
            },
        })

        // Update troca status
        await prisma.troca.update({
            where: { id },
            data: {
                statusAtual: 'NF_EMITIDA_AGUARDANDO_DESTINO',
                historico: {
                    create: {
                        campo: 'statusAtual',
                        valorAntigo: 'RASCUNHO_NF_VALIDACAO',
                        valorNovo: 'NF_EMITIDA_AGUARDANDO_DESTINO',
                    },
                },
            },
        })

        return NextResponse.json(nfDevolucao, { status: 201 })
    } catch (error) {
        console.error('Error creating NF devolução:', error)
        return NextResponse.json({ error: 'Erro ao emitir NF devolução' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { produtoEnviado, dataEnvio } = body

        const nfDevolucao = await prisma.nFDevolucao.update({
            where: { trocaId: id },
            data: {
                produtoEnviado,
                dataEnvio: dataEnvio ? new Date(dataEnvio) : new Date(),
            },
        })

        return NextResponse.json(nfDevolucao)
    } catch (error) {
        console.error('Error updating NF devolução:', error)
        return NextResponse.json({ error: 'Erro ao atualizar NF devolução' }, { status: 500 })
    }
}
