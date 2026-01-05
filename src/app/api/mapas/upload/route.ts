import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'
import type { Componente, SerieEM, Bimestre } from '@/types'

// ═══════════════════════════════════════════════════════════
// API: Upload de Mapa Mental
// POST - Upload com conversão automática para WebP
// Apenas professores podem fazer upload
// ═══════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB original
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Configurações de otimização
const IMAGE_CONFIG = {
  main: { width: 1200, quality: 85 },      // Imagem principal
  thumbnail: { width: 400, quality: 75 },   // Thumbnail para listagem
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Apenas professores podem fazer upload' },
        { status: 403 }
      )
    }

    // Processar FormData
    const formData = await request.formData()
    const file = formData.get('imagem') as File | null
    const componente = formData.get('componente') as Componente
    const serie = parseInt(formData.get('serie') as string) as SerieEM
    const bimestre = parseInt(formData.get('bimestre') as string) as Bimestre
    const titulo = formData.get('titulo') as string
    const descricao = formData.get('descricao') as string | null
    const tema = formData.get('tema') as string | null

    // Validações
    if (!file) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nenhuma imagem enviada' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Formato inválido. Use JPG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { sucesso: false, erro: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    if (!serie || ![1, 2, 3].includes(serie)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Série inválida (1, 2 ou 3)' },
        { status: 400 }
      )
    }

    if (!bimestre || ![1, 2, 3, 4].includes(bimestre)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Bimestre inválido (1 a 4)' },
        { status: 400 }
      )
    }

    if (!titulo || titulo.trim().length < 3) {
      return NextResponse.json(
        { sucesso: false, erro: 'Título deve ter pelo menos 3 caracteres' },
        { status: 400 }
      )
    }

    // Converter imagem para buffer
    const originalBuffer = Buffer.from(await file.arrayBuffer())

    // ═══════════════════════════════════════════════════════════
    // CONVERSÃO PARA WEBP COM SHARP
    // ═══════════════════════════════════════════════════════════

    // Imagem principal (WebP otimizado)
    const mainWebp = await sharp(originalBuffer)
      .webp({ quality: IMAGE_CONFIG.main.quality })
      .resize(IMAGE_CONFIG.main.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toBuffer()

    // Thumbnail (menor, para listagem)
    const thumbWebp = await sharp(originalBuffer)
      .webp({ quality: IMAGE_CONFIG.thumbnail.quality })
      .resize(IMAGE_CONFIG.thumbnail.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toBuffer()

    // Converter para base64 Data URL
    const mainBase64 = `data:image/webp;base64,${mainWebp.toString('base64')}`
    const thumbBase64 = `data:image/webp;base64,${thumbWebp.toString('base64')}`

    // ═══════════════════════════════════════════════════════════
    // SALVAR NO BANCO DE DADOS
    // ═══════════════════════════════════════════════════════════

    const { data: mapa, error } = await supabase
      .from('mapas_mentais')
      .insert({
        componente,
        serie,
        bimestre,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        tema: tema?.trim() || null,
        imagem_url: mainBase64,
        thumbnail_url: thumbBase64,
        curtidas: 0,
        downloads: 0,
        visualizacoes: 0,
        ativo: true,
        destaque: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar mapa:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao salvar mapa mental' },
        { status: 500 }
      )
    }

    // Estatísticas de compressão
    const stats = {
      original: file.size,
      comprimido: mainWebp.length,
      thumbnail: thumbWebp.length,
      reducao: Math.round((1 - mainWebp.length / file.size) * 100)
    }

    return NextResponse.json({
      sucesso: true,
      mapa,
      stats,
      mensagem: `Mapa salvo! Compressão: ${stats.reducao}% menor`
    })

  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
