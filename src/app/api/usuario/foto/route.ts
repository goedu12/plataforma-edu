import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════
// API: Upload de Foto de Perfil
// Armazena como base64 no banco (simples e funciona sem storage)
// POST /api/usuario/foto - Upload nova foto
// DELETE /api/usuario/foto - Remove foto atual
// ═══════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 500 * 1024 // 500KB para base64
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('foto') as File | null

    if (!file) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Formato inválido. Use JPG, PNG ou WebP.' },
        { status: 400 }
      )
    }

    // Validar tamanho (menor para base64)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { sucesso: false, erro: 'Arquivo muito grande. Máximo 500KB.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Converter para base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const fotoUrl = `data:${file.type};base64,${base64}`

    // Atualizar usuário com a foto em base64
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ foto_url: fotoUrl })
      .eq('id', sessao.userId)

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao salvar foto no perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      foto_url: fotoUrl,
      mensagem: 'Foto atualizada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao processar foto:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Limpar URL no usuário
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ foto_url: null })
      .eq('id', sessao.userId)

    if (updateError) {
      console.error('Erro ao limpar foto:', updateError)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao remover foto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Foto removida com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao remover foto:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
