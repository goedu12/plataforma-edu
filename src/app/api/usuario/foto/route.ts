import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════
// API: Upload de Foto de Perfil
// POST /api/usuario/foto - Upload nova foto
// DELETE /api/usuario/foto - Remove foto atual
// ═══════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
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

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { sucesso: false, erro: 'Arquivo muito grande. Máximo 2MB.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Converter para buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Gerar nome único
    const extension = file.type.split('/')[1]
    const fileName = `${sessao.userId}/avatar.${extension}`

    // Fazer upload para o bucket avatars
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true // Sobrescreve se já existir
      })

    if (uploadError) {
      console.error('Erro upload:', uploadError)

      // Se o bucket não existe, retornar erro amigável
      if (uploadError.message.includes('not found')) {
        return NextResponse.json(
          { sucesso: false, erro: 'Storage não configurado. Contate o administrador.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao fazer upload da foto' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const fotoUrl = urlData.publicUrl

    // Atualizar usuário com a URL da foto
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

    // Remover arquivos do storage
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(sessao.userId)

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${sessao.userId}/${f.name}`)
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete)
    }

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
