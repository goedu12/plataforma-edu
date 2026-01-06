import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'studao-secret-key-2024'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Verificar se é professor
async function verificarProfessor(): Promise<{ autorizado: boolean; usuarioId?: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return { autorizado: false }
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (payload.tipo !== 'professor') {
      return { autorizado: false }
    }

    return { autorizado: true, usuarioId: payload.id as string }
  } catch {
    return { autorizado: false }
  }
}

// GET - Obter logo atual
export async function GET() {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({
        sucesso: true,
        logo_url: null
      })
    }

    const { data, error } = await supabase
      .from('configuracoes_plataforma')
      .select('valor')
      .eq('chave', 'logo_url')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar logo:', error)
    }

    return NextResponse.json({
      sucesso: true,
      logo_url: data?.valor || null
    })
  } catch (error) {
    console.error('Erro ao buscar logo:', error)
    return NextResponse.json({
      sucesso: true,
      logo_url: null
    })
  }
}

// POST - Upload de novo logo
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { sucesso: false, erro: 'Serviço de armazenamento não configurado.' },
        { status: 503 }
      )
    }

    // Verificar autorização
    const { autorizado, usuarioId } = await verificarProfessor()
    if (!autorizado) {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado. Apenas professores podem alterar o logo.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Tipo de arquivo não permitido. Use PNG, JPG, WebP ou SVG.' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { sucesso: false, erro: 'Arquivo muito grande. Máximo 2MB.' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const extensao = file.name.split('.').pop() || 'png'
    const nomeArquivo = `logo_${Date.now()}.${extensao}`

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Deletar logo anterior se existir
    const { data: configAtual } = await supabase
      .from('configuracoes_plataforma')
      .select('valor')
      .eq('chave', 'logo_url')
      .single()

    if (configAtual?.valor) {
      // Extrair nome do arquivo da URL
      const urlAntiga = configAtual.valor
      const nomeAntigo = urlAntiga.split('/').pop()
      if (nomeAntigo) {
        await supabase.storage.from('logos').remove([nomeAntigo])
      }
    }

    // Upload do novo logo
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(nomeArquivo, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao fazer upload do logo. Verifique se o bucket "logos" existe no Supabase.' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(nomeArquivo)

    const logoUrl = urlData.publicUrl

    // Atualizar configuração no banco
    const { error: updateError } = await supabase
      .from('configuracoes_plataforma')
      .upsert({
        chave: 'logo_url',
        valor: logoUrl,
        tipo: 'url',
        descricao: 'URL do logo da plataforma no Supabase Storage',
        atualizado_em: new Date().toISOString(),
        atualizado_por: usuarioId
      }, {
        onConflict: 'chave'
      })

    if (updateError) {
      console.error('Erro ao atualizar configuração:', updateError)
      // Mesmo com erro no banco, o upload foi bem sucedido
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Logo atualizado com sucesso!',
      logo_url: logoUrl
    })
  } catch (error) {
    console.error('Erro ao processar upload:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover logo (volta ao padrão)
export async function DELETE() {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { sucesso: false, erro: 'Serviço de armazenamento não configurado.' },
        { status: 503 }
      )
    }

    // Verificar autorização
    const { autorizado, usuarioId } = await verificarProfessor()
    if (!autorizado) {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado. Apenas professores podem remover o logo.' },
        { status: 403 }
      )
    }

    // Buscar logo atual
    const { data: configAtual } = await supabase
      .from('configuracoes_plataforma')
      .select('valor')
      .eq('chave', 'logo_url')
      .single()

    if (configAtual?.valor) {
      // Extrair nome do arquivo da URL
      const urlAtual = configAtual.valor
      const nomeArquivo = urlAtual.split('/').pop()

      if (nomeArquivo) {
        // Deletar do storage
        await supabase.storage.from('logos').remove([nomeArquivo])
      }
    }

    // Limpar configuração no banco
    const { error: updateError } = await supabase
      .from('configuracoes_plataforma')
      .upsert({
        chave: 'logo_url',
        valor: null,
        tipo: 'url',
        descricao: 'URL do logo da plataforma no Supabase Storage',
        atualizado_em: new Date().toISOString(),
        atualizado_por: usuarioId
      }, {
        onConflict: 'chave'
      })

    if (updateError) {
      console.error('Erro ao limpar configuração:', updateError)
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Logo removido. O logo padrão será exibido.'
    })
  } catch (error) {
    console.error('Erro ao remover logo:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
