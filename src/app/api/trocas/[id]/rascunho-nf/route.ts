import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rascunhoNF = await prisma.rascunhoNF.findUnique({
            where: { trocaId: id },
        })
        return NextResponse.json(rascunhoNF)
    } catch (error) {
        console.error('Error fetching rascunho NF:', error)
        return NextResponse.json({ error: 'Erro ao buscar rascunho NF' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { numeroRascunho } = body

        const rascunhoNF = await prisma.rascunhoNF.create({
            data: {
                trocaId: id,
                rascunhoGerado: true,
                numeroRascunho,
                dataCriacao: new Date(),
            },
        })

        // Update troca status
        await prisma.troca.update({
            where: { id },
            data: {
                statusAtual: 'RASCUNHO_NF_VALIDACAO',
                historico: {
                    create: {
                        campo: 'statusAtual',
                        valorAntigo: 'ORCAMENTO_APROVADO',
                        valorNovo: 'RASCUNHO_NF_VALIDACAO',
                    },
                },
            },
        })

        return NextResponse.json(rascunhoNF, { status: 201 })
    } catch (error) {
        console.error('Error creating rascunho NF:', error)
        return NextResponse.json({ error: 'Erro ao criar rascunho NF' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { aprovadoFornecedor } = body

        const rascunhoNF = await prisma.rascunhoNF.update({
            where: { trocaId: id },
            data: { aprovadoFornecedor },
        })

        return NextResponse.json(rascunhoNF)
    } catch (error) {
        console.error('Error updating rascunho NF:', error)
        return NextResponse.json({ error: 'Erro ao atualizar rascunho NF' }, { status: 500 })
    }
}
