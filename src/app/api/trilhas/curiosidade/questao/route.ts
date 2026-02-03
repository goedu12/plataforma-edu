export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { buscarCuriosidade } from '@/lib/curiosidades-fisica'

// ═══════════════════════════════════════════════════════════
// API DE QUESTÕES DA TRILHA CURIOSIDADE
// Busca questões baseadas no tema selecionado
// ═══════════════════════════════════════════════════════════

// GET - Buscar próxima questão do tema
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const temaId = searchParams.get('tema')
    const serie = searchParams.get('serie') || '1EM'

    if (!temaId) {
      return NextResponse.json({ sucesso: false, erro: 'Tema não especificado' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar tema para obter os conteúdos
    const { data: tema, error: erroTema } = await supabase
      .from('trilha_temas_curiosidade')
      .select('*')
      .eq('id', temaId)
      .single()

    if (erroTema || !tema) {
      return NextResponse.json({ sucesso: false, erro: 'Tema não encontrado' }, { status: 404 })
    }

    // Buscar IDs das questões já respondidas pelo usuário
    const { data: respondidas } = await supabase
      .from('respostas_trilha')
      .select('questao_id')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('trilha_id', 'curiosidade')

    const idsRespondidas = respondidas?.map(r => r.questao_id) || []

    // Buscar próxima questão que:
    // 1. Pertence aos conteúdos do tema
    // 2. Não foi respondida pelo usuário
    // 3. É do tipo adequado para curiosidade (conceitual, analise_fenomeno)
    let query = supabase
      .from('questoes_trilha')
      .select('*')
      .eq('serie', serie)
      .eq('ativa', true)
      .in('tipo_questao', ['conceitual', 'analise_fenomeno', 'situacao_problema'])
      .order('ordem', { ascending: true })
      .limit(1)

    // Excluir questões já respondidas
    if (idsRespondidas.length > 0) {
      query = query.not('id', 'in', `(${idsRespondidas.join(',')})`)
    }

    // Filtrar por temas do conteúdo
    if (tema.conteudos_fisica && tema.conteudos_fisica.length > 0) {
      // Usar overlaps para verificar se o tema da questão está nos conteúdos
      // O campo tema em questoes_trilha é um VARCHAR, então comparamos diretamente
      query = query.in('tema', tema.conteudos_fisica)
    }

    const { data: questoes, error: erroQuestoes } = await query

    // Se não encontrar com filtro de tema, buscar qualquer questão não respondida
    let questao = questoes?.[0]

    if (!questao) {
      // Fallback: buscar do banco geral de questões
      const { data: questoesGeral } = await supabase
        .from('questoes')
        .select('*')
        .eq('componente', 'fisica')
        .eq('ativa', true)
        .in('tema', tema.conteudos_fisica || [])
        .not('id', 'in', `(${idsRespondidas.length > 0 ? idsRespondidas.join(',') : '0'})`)
        .limit(1)

      if (questoesGeral?.[0]) {
        // Transformar formato da questão geral para o esperado
        questao = {
          id: questoesGeral[0].id,
          enunciado: questoesGeral[0].enunciado,
          alternativas: {
            A: questoesGeral[0].alternativa_a,
            B: questoesGeral[0].alternativa_b,
            C: questoesGeral[0].alternativa_c,
            D: questoesGeral[0].alternativa_d,
            E: questoesGeral[0].alternativa_e,
          },
          resposta_correta: questoesGeral[0].correta,
          dica: questoesGeral[0].dica || 'Pense no conceito por trás do fenômeno.',
          feedback: {
            explicacao_correta: questoesGeral[0].explicacao || 'Correto!',
            curiosidade: `Isso está relacionado ao tema "${tema.nome}".`,
          },
          tema: questoesGeral[0].tema,
          subtema: questoesGeral[0].subtema || '',
          dificuldade: 'medio',
          tipo_questao: 'conceitual',
          contexto_cotidiano: 'todos',
        }
      }
    }

    if (!questao) {
      return NextResponse.json({
        sucesso: true,
        questao: null,
        temaConcluido: true,
        mensagem: 'Você completou todas as questões disponíveis deste tema!',
      })
    }

    // Contar progresso
    const totalRespondidas = idsRespondidas.length
    const { count: totalCorretas } = await supabase
      .from('respostas_trilha')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', sessaoAuth.userId)
      .eq('trilha_id', 'curiosidade')
      .eq('correta', true)

    // Sortear tipo de atividade: 40% múltipla escolha, 30% V/F, 30% complete a fórmula
    const sorteio = Math.random()
    let tipoAtividade: 'multipla_escolha' | 'verdadeiro_falso' | 'complete_formula' = 'multipla_escolha'

    if (sorteio < 0.3) {
      tipoAtividade = 'verdadeiro_falso'
    } else if (sorteio < 0.6) {
      tipoAtividade = 'complete_formula'
    }

    // Montar dados extras conforme tipo de atividade
    let dadosExtra: Record<string, unknown> = {}
    const alternativas = questao.alternativas as Record<string, string> | null
    const respostaCorreta = (questao.resposta_correta || '') as string

    if (tipoAtividade === 'verdadeiro_falso' && alternativas && respostaCorreta) {
      // Criar afirmação a partir da alternativa correta
      const textoCorreto = alternativas[respostaCorreta]
      if (textoCorreto) {
        // 50% chance de ser verdadeiro, 50% falso (usando alternativa errada)
        const ehVerdadeiro = Math.random() < 0.5
        let afirmacao = textoCorreto
        let justificativa = textoCorreto

        if (!ehVerdadeiro) {
          // Pegar uma alternativa errada para usar como afirmação falsa
          const letrasErradas = Object.keys(alternativas).filter(
            l => l !== respostaCorreta && alternativas[l]
          )
          if (letrasErradas.length > 0) {
            const letraErrada = letrasErradas[Math.floor(Math.random() * letrasErradas.length)]
            afirmacao = alternativas[letraErrada]
            justificativa = `A afirmação está incorreta. O correto é: ${textoCorreto}`
          }
        } else {
          justificativa = `Correto! ${textoCorreto}`
        }

        dadosExtra = {
          afirmacao,
          respostaVF: ehVerdadeiro ? 'V' : 'F',
          justificativa,
        }
      } else {
        tipoAtividade = 'multipla_escolha' // fallback
      }
    } else if (tipoAtividade === 'complete_formula' && alternativas && respostaCorreta) {
      // Usar a alternativa correta como "fórmula completa" e esconder parte dela
      const textoCorreto = alternativas[respostaCorreta]
      if (textoCorreto && textoCorreto.length > 3) {
        // Encontrar um trecho para esconder (palavra ou símbolo)
        const palavras = textoCorreto.split(/\s+/)
        if (palavras.length >= 2) {
          // Esconder uma palavra aleatória (não a primeira)
          const idxEsconder = 1 + Math.floor(Math.random() * (palavras.length - 1))
          const palavraEscondida = palavras[idxEsconder]
          const formulaComLacuna = palavras.map((p, i) => i === idxEsconder ? '______' : p).join(' ')

          // Criar opções: a correta + 2 distratores das alternativas erradas
          const opcoes: string[] = [palavraEscondida]
          const letrasErradas = Object.keys(alternativas).filter(
            l => l !== respostaCorreta && alternativas[l]
          )
          for (const letraErrada of letrasErradas.slice(0, 2)) {
            const textoErrado = alternativas[letraErrada]
            const palavrasErradas = textoErrado.split(/\s+/)
            if (palavrasErradas.length > idxEsconder) {
              opcoes.push(palavrasErradas[idxEsconder])
            } else if (palavrasErradas.length > 0) {
              opcoes.push(palavrasErradas[Math.floor(Math.random() * palavrasErradas.length)])
            }
          }

          // Embaralhar opções
          const opcoesEmbaralhadas = opcoes.sort(() => Math.random() - 0.5)

          dadosExtra = {
            formulaComLacuna,
            respostaLacuna: palavraEscondida,
            opcoes: opcoesEmbaralhadas,
            textoCompleto: textoCorreto,
          }
        } else {
          tipoAtividade = 'multipla_escolha' // fallback
        }
      } else {
        tipoAtividade = 'multipla_escolha' // fallback
      }
    }

    // Buscar curiosidade física relacionada ao tema da questão
    const componente = 'fisica' // Trilha curiosidade é sempre de física
    const curiosidade = buscarCuriosidade(questao.tema || tema.nome, componente)

    return NextResponse.json({
      sucesso: true,
      questao: {
        id: questao.id,
        enunciado: questao.enunciado,
        alternativas: questao.alternativas,
        dica: questao.dica,
        tema: questao.tema,
        subtema: questao.subtema,
        dificuldade: questao.dificuldade,
        tipo: questao.tipo_questao,
        contexto: questao.contexto_cotidiano,
        tipoAtividade,
        ...dadosExtra,
      },
      curiosidade: {
        voceSabia: curiosidade.voceSabia,
        saibaMais: curiosidade.saibaMais,
        fonteReal: curiosidade.fonteReal || null,
      },
      progresso: {
        respondidas: totalRespondidas,
        corretas: totalCorretas || 0,
        total: tema.total_questoes,
      },
      tema: {
        id: tema.id,
        nome: tema.nome,
        icone: tema.icone,
      },
    })
  } catch (error) {
    console.error('[Curiosidade Questão] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// POST - Responder questão
export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { questaoId, resposta, tempo, usouDica, tipoAtividade, respostaVF, respostaVFEsperada, respostaLacuna, respostaLacunaEsperada } = await request.json()

    if (!questaoId) {
      return NextResponse.json({ sucesso: false, erro: 'Dados incompletos' }, { status: 400 })
    }

    // Para V/F e Complete, a resposta vem em campos específicos
    const respostaFinal = tipoAtividade === 'verdadeiro_falso'
      ? respostaVF
      : tipoAtividade === 'complete_formula'
        ? respostaLacuna
        : resposta

    if (!respostaFinal) {
      return NextResponse.json({ sucesso: false, erro: 'Resposta não fornecida' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar questão para verificar resposta correta
    let respostaCorreta: string | null = null
    interface FeedbackType {
      explicacao_correta?: string
      curiosidade?: string
      erros_comuns?: Record<string, string>
    }
    let feedback: FeedbackType = {}

    // Tentar buscar em questoes_trilha primeiro
    const { data: questaoTrilha } = await supabase
      .from('questoes_trilha')
      .select('resposta_correta, feedback')
      .eq('id', questaoId)
      .single()

    if (questaoTrilha) {
      respostaCorreta = questaoTrilha.resposta_correta
      feedback = questaoTrilha.feedback || {}
    } else {
      // Buscar em questoes (banco geral)
      const { data: questaoGeral } = await supabase
        .from('questoes')
        .select('correta, explicacao')
        .eq('id', questaoId)
        .single()

      if (questaoGeral) {
        respostaCorreta = questaoGeral.correta
        feedback = { explicacao_correta: questaoGeral.explicacao }
      }
    }

    if (!respostaCorreta) {
      return NextResponse.json({ sucesso: false, erro: 'Questão não encontrada' }, { status: 404 })
    }

    // Verificar resposta baseada no tipo de atividade
    let correta = false
    if (tipoAtividade === 'verdadeiro_falso') {
      correta = respostaVF === respostaVFEsperada
    } else if (tipoAtividade === 'complete_formula') {
      correta = respostaLacuna?.trim().toLowerCase() === respostaLacunaEsperada?.trim().toLowerCase()
    } else {
      correta = respostaFinal.toUpperCase() === respostaCorreta.toUpperCase()
    }

    // Calcular pontos
    let pontos = 0
    if (correta) {
      pontos = usouDica ? 5 : 10 // 10 pts normal, 5 pts com dica
    }

    // Salvar resposta
    const { error: erroResposta } = await supabase
      .from('respostas_trilha')
      .upsert({
        usuario_id: sessaoAuth.userId,
        questao_id: questaoId,
        trilha_id: 'curiosidade',
        resposta_dada: (respostaFinal || '').toString().toUpperCase(),
        correta,
        tempo_segundos: tempo || 0,
        usou_dica: usouDica || false,
        pontos_ganhos: pontos,
      }, {
        onConflict: 'usuario_id,questao_id',
      })

    if (erroResposta) {
      console.error('[Curiosidade] Erro ao salvar resposta:', erroResposta)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar resposta' }, { status: 500 })
    }

    // Atualizar pontos no usuario_trilha
    if (correta) {
      try {
        await supabase.rpc('incrementar_pontos_trilha', {
          p_usuario_id: sessaoAuth.userId,
          p_trilha_id: 'curiosidade',
          p_pontos: pontos,
        })
      } catch {
        // Função pode não existir, ignorar erro
      }
    }

    return NextResponse.json({
      sucesso: true,
      correta,
      respostaCorreta,
      pontos,
      feedback: {
        explicacao: feedback.explicacao_correta || (correta ? 'Correto!' : 'Não foi dessa vez.'),
        curiosidade: feedback.curiosidade || null,
        erroComum: !correta && feedback.erros_comuns
          ? feedback.erros_comuns[resposta.toUpperCase()]
          : null,
      },
    })
  } catch (error) {
    console.error('[Curiosidade Questão] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
