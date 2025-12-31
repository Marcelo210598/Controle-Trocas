import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const desconto = await prisma.desconto.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(desconto)
    } catch (error) {
        console.error('Error fetching desconto:', error)
        return NextResponse.json({ error: 'Erro ao buscar desconto' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { valorDesconto, boletoGerado, dataBoleto } = body

        const desconto = await prisma.desconto.create({
            data: {
                trocaId: id,
                valorDesconto,
                boletoGerado: boletoGerado || false,
                dataBoleto: dataBoleto ? new Date(dataBoleto) : null,
            },
        })

        // Update troca
        await prisma.troca.update({
            where: { id },
            data: {
                tipoCompensacao: 'DESCONTO',
                statusAtual: 'AGUARDANDO_DESCONTO',
                historico: {
                    create: {
                        campo: 'tipoCompensacao',
                        valorAntigo: null,
                        valorNovo: 'DESCONTO',
                    },
                },
            },
        })

        return NextResponse.json(desconto, { status: 201 })
    } catch (error) {
        console.error('Error creating desconto:', error)
        return NextResponse.json({ error: 'Erro ao registrar desconto' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { descontoAplicado, boletoGerado, dataBoleto } = body

        const desconto = await prisma.desconto.update({
            where: { trocaId: id },
            data: {
                descontoAplicado,
                boletoGerado,
                dataBoleto: dataBoleto ? new Date(dataBoleto) : undefined,
            },
        })

        // Update status if discount was applied
        if (descontoAplicado) {
            await prisma.troca.update({
                where: { id },
                data: {
                    statusAtual: 'TROCA_RESOLVIDA',
                    historico: {
                        create: {
                            campo: 'statusAtual',
                            valorAntigo: 'AGUARDANDO_DESCONTO',
                            valorNovo: 'TROCA_RESOLVIDA',
                        },
                    },
                },
            })
        }

        return NextResponse.json(desconto)
    } catch (error) {
        console.error('Error updating desconto:', error)
        return NextResponse.json({ error: 'Erro ao atualizar desconto' }, { status: 500 })
    }
}
