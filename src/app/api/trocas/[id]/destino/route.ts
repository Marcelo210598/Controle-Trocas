import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const destinoItem = await prisma.destinoItem.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(destinoItem)
    } catch (error) {
        console.error('Error fetching destino item:', error)
        return NextResponse.json({ error: 'Erro ao buscar destino do item' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { fornecedorRetirara, descarte } = body

        const destinoItem = await prisma.destinoItem.create({
            data: {
                trocaId: id,
                fornecedorRetirara: fornecedorRetirara || false,
                descarte: descarte || false,
            },
        })

        // Update status based on destination
        if (fornecedorRetirara) {
            await prisma.troca.update({
                where: { id },
                data: {
                    statusAtual: 'AGUARDANDO_RETIRADA',
                    historico: {
                        create: {
                            campo: 'statusAtual',
                            valorAntigo: 'NF_EMITIDA_AGUARDANDO_DESTINO',
                            valorNovo: 'AGUARDANDO_RETIRADA',
                        },
                    },
                },
            })
        }

        return NextResponse.json(destinoItem, { status: 201 })
    } catch (error) {
        console.error('Error creating destino item:', error)
        return NextResponse.json({ error: 'Erro ao definir destino do item' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { coletaRealizada, dataColeta, descarte, dataDescarte } = body

        const updateData: Record<string, unknown> = {}

        if (coletaRealizada !== undefined) {
            updateData.coletaRealizada = coletaRealizada
            updateData.dataColeta = dataColeta ? new Date(dataColeta) : new Date()
        }

        if (descarte !== undefined) {
            updateData.descarte = descarte
            updateData.dataDescarte = dataDescarte ? new Date(dataDescarte) : new Date()
        }

        const destinoItem = await prisma.destinoItem.update({
            where: { trocaId: id },
            data: updateData,
        })

        // Update troca status if item was collected or discarded
        if (coletaRealizada || descarte) {
            const newStatus = descarte ? 'ITEM_DESCARTADO' : 'TROCA_RESOLVIDA'
            await prisma.troca.update({
                where: { id },
                data: {
                    statusAtual: newStatus,
                    historico: {
                        create: {
                            campo: 'statusAtual',
                            valorAntigo: 'AGUARDANDO_RETIRADA',
                            valorNovo: newStatus,
                        },
                    },
                },
            })
        }

        return NextResponse.json(destinoItem)
    } catch (error) {
        console.error('Error updating destino item:', error)
        return NextResponse.json({ error: 'Erro ao atualizar destino do item' }, { status: 500 })
    }
}
