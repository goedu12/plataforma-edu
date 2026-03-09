'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { detectarGeneroTextual, separarTextoEFonte, formatarPorGenero, type GeneroTextual } from '@/lib/limpezaTexto'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ConteudoQuestao
// Renderiza conteúdo de questões ENEM com suporte a:
// - HTML permitido (strong, em, small, sup, sub, br)
// - LaTeX/KaTeX para fórmulas matemáticas ($...$, $$...$$)
// - Markdown para formatação rica
// - Descrições de imagens em itálico [...]
// - Fontes e referências em tamanho menor (UMA LINHA ABAIXO, alinhada à esquerda)
// - Detecção automática de gênero textual (prosa, poema, citação, diálogo, etc.)
// - Parágrafos com recuo na primeira linha (padrão ENEM)
// - Travessões de diálogo em parágrafos separados
// ═══════════════════════════════════════════════════════════════════════════════

interface ConteudoQuestaoProps {
  conteudo: string
  tipo?: 'contexto' | 'comando' | 'alternativa' | 'fonte'
  className?: string
  /** Se true, renderiza fonte em linha separada abaixo do texto */
  separarFonte?: boolean
}

// Converte HTML específico para Markdown compatível com KaTeX
// IMPORTANTE: Garante que parágrafos sejam separados corretamente para aplicar recuo
// PADRÃO ENEM: Cada parágrafo deve ter recuo na primeira linha
function htmlParaMarkdown(html: string): string {
  if (!html) return ''

  let texto = html

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: PRÉ-PROCESSAMENTO - Normalizar caracteres especiais
  // ═══════════════════════════════════════════════════════════════════════════

  // Normalizar diferentes tipos de travessão para o padrão Unicode (em dash)
  texto = texto.replace(/—|–|--/g, '—') // Padronizar para em dash (U+2014)

  // Normalizar aspas
  texto = texto.replace(/[""]/g, '"')
  texto = texto.replace(/['']/g, "'")

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: ESTRUTURA DE PARÁGRAFOS - Tags HTML
  // ═══════════════════════════════════════════════════════════════════════════

  // Converter </p><p> em dupla quebra (novo parágrafo)
  texto = texto.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  // Converter <p> e </p> isolados em quebras
  texto = texto.replace(/<p[^>]*>/gi, '')
  texto = texto.replace(/<\/p>/gi, '\n\n')

  // Converter </div><div> em dupla quebra (novo parágrafo)
  texto = texto.replace(/<\/div>\s*<div[^>]*>/gi, '\n\n')
  texto = texto.replace(/<div[^>]*>/gi, '')
  texto = texto.replace(/<\/div>/gi, '\n\n')

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: QUEBRAS DE LINHA <br>
  // ═══════════════════════════════════════════════════════════════════════════

  // Múltiplos <br> seguidos = novo parágrafo
  texto = texto.replace(/(<br\s*\/?>\s*){2,}/gi, '\n\n')

  // <br> único = quebra de linha simples (dentro do mesmo parágrafo)
  texto = texto.replace(/<br\s*\/?>/gi, '\n')

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 4: TRAVESSÕES DE DIÁLOGO - Padrão ENEM
  // Cada fala com travessão deve iniciar um novo parágrafo
  // ═══════════════════════════════════════════════════════════════════════════

  // Travessão após pontuação final (.!?) = novo parágrafo
  texto = texto.replace(/([.!?])\s*—\s*/g, '$1\n\n— ')

  // Travessão após aspas fechando = novo parágrafo
  texto = texto.replace(/([""'])\s*—\s*/g, '$1\n\n— ')

  // Travessão no meio do texto (após palavra) = novo parágrafo
  texto = texto.replace(/([a-záàâãéêíóôõúç])\s+—\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/gi, '$1\n\n— $2')

  // Travessão no início absoluto ou após quebra = garantir formato
  texto = texto.replace(/^\s*—\s*/gm, '— ')

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 5: DETECÇÃO INTELIGENTE DE PARÁGRAFOS
  // Ponto final + espaços + letra maiúscula = possível novo parágrafo
  // CUIDADO: Não quebrar abreviações, siglas ou nomes próprios
  // ═══════════════════════════════════════════════════════════════════════════

  // Lista de abreviações comuns que NÃO devem quebrar parágrafo
  const abreviacoes = /(?:Dr|Dra|Sr|Sra|Prof|Profa|Fig|Tab|Art|Inc|Ltda|S\.A|etc|vol|p|pp|ed|org|coord|n|nº|ex)\./gi

  // Proteger abreviações temporariamente
  const protecoes: string[] = []
  texto = texto.replace(abreviacoes, (match) => {
    protecoes.push(match)
    return `§§ABREV${protecoes.length - 1}§§`
  })

  // Detectar fim de frase + início de novo parágrafo
  // Padrão: ponto/exclamação/interrogação + 2+ espaços + maiúscula = novo parágrafo
  texto = texto.replace(/([.!?])\s{2,}([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1\n\n$2')

  // Restaurar abreviações
  texto = texto.replace(/§§ABREV(\d+)§§/g, (_, index) => protecoes[parseInt(index)])

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 6: CONVERTER TAGS HTML PARA MARKDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  texto = texto.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  texto = texto.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  texto = texto.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  texto = texto.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  texto = texto.replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>') // Manter underline como HTML

  // Manter <sup> e <sub> como HTML - o rehype-raw vai processar corretamente
  texto = texto.replace(/<sup>([\s\S]*?)<\/sup>/gi, '<sup>$1</sup>')
  texto = texto.replace(/<sub>([\s\S]*?)<\/sub>/gi, '<sub>$1</sub>')

  // Converter <small> para classe especial - fonte alinhada à esquerda
  texto = texto.replace(/<small>([\s\S]*?)<\/small>/gi, '<span class="questao-fonte">$1</span>')

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 7: LIMPAR E NORMALIZAR
  // ═══════════════════════════════════════════════════════════════════════════

  // Remover spans SEM classes importantes
  texto = texto.replace(/<span(?![^>]*class=["'](?:questao-fonte|ref-figura|ref-tabela|questao-titulo|titulo-texto)["'])[^>]*>([\s\S]*?)<\/span>/gi, '$1')

  // Normalizar quebras de linha: máximo 2 consecutivas
  texto = texto.replace(/\n{3,}/g, '\n\n')

  // Limpar espaços extras no início/fim de linhas (preservar indentação intencional)
  texto = texto.split('\n').map(linha => linha.trim()).join('\n')

  // Limpar espaços múltiplos dentro do texto
  texto = texto.replace(/[ \t]{2,}/g, ' ')

  texto = texto.trim()

  return texto
}

// Detecta se o texto contém fórmulas LaTeX ou notação científica
// IMPORTANTE: Ignora valores monetários (R$) que não são LaTeX
function contemLatex(texto: string): boolean {
  // Primeiro, remover valores monetários para não confundir com LaTeX
  const textoSemMonetario = texto.replace(/R\$\s*[\d.,]+/g, '')

  const padroes = [
    /\$[^$]+\$/,           // $inline$ (mas não R$)
    /\$\$[^$]+\$\$/,       // $$block$$
    /\\frac\{/,            // \frac{}{}
    /\\sqrt\{/,            // \sqrt{}
    /\\sum/,               // \sum
    /\\int/,               // \int
    /\\lim/,               // \lim
    /\\infty/,             // \infty
    /\^{[^}]+}/,           // ^{expoente}
    /_{[^}]+}/,            // _{subscrito}
    /\\[a-zA-Z]+\{/,       // qualquer comando LaTeX
    /\\times/,             // multiplicação LaTeX
    /\\div/,               // divisão LaTeX
    /\\pm/,                // mais ou menos LaTeX
    /\\vec\{/,             // vetor LaTeX
    /\\overline\{/,        // barra sobre
    /\\Delta/,             // delta LaTeX
  ]

  return padroes.some(p => p.test(textoSemMonetario))
}

// Protege valores monetários (R$) de serem interpretados como LaTeX
function protegerValoresMonetarios(texto: string): string {
  // Substitui R$ por um placeholder que não será interpretado como LaTeX
  return texto.replace(/R\$\s*([\d.,]+)/g, 'R§CIFRAO§$1')
}

// Restaura valores monetários após o processamento
function restaurarValoresMonetarios(texto: string): string {
  return texto.replace(/R§CIFRAO§/g, 'R$ ')
}

// Formata símbolos especiais comuns em questões ENEM
function formatarSimbolos(texto: string): string {
  // Primeiro, proteger valores monetários
  let resultado = protegerValoresMonetarios(texto)

  // Símbolos químicos, físicos e matemáticos
  const substituicoes: [RegExp, string][] = [
    // ═══════════════════════════════════════════════════════════════════════════
    // UNIDADES DE MEDIDA (todas as áreas)
    // ═══════════════════════════════════════════════════════════════════════════
    // Temperatura
    [/(\d+)\s*°C/g, '$1 °C'],
    [/(\d+)\s*°F/g, '$1 °F'],
    [/(\d+)\s*K(?![a-zA-Z])/g, '$1 K'],
    // Velocidade e aceleração
    [/(\d+)\s*m\/s²/g, '$1 m/s²'],
    [/(\d+)\s*m\/s/g, '$1 m/s'],
    [/(\d+)\s*km\/h/g, '$1 km/h'],
    [/(\d+)\s*cm\/s/g, '$1 cm/s'],
    // Área e volume
    [/(\d+)\s*m²/g, '$1 m²'],
    [/(\d+)\s*m³/g, '$1 m³'],
    [/(\d+)\s*cm²/g, '$1 cm²'],
    [/(\d+)\s*cm³/g, '$1 cm³'],
    [/(\d+)\s*km²/g, '$1 km²'],
    [/(\d+)\s*km³/g, '$1 km³'],
    [/(\d+)\s*mm²/g, '$1 mm²'],
    [/(\d+)\s*mm³/g, '$1 mm³'],
    // Química
    [/(\d+)\s*J\/mol/g, '$1 J/mol'],
    [/(\d+)\s*kJ\/mol/g, '$1 kJ/mol'],
    [/(\d+)\s*g\/mol/g, '$1 g/mol'],
    [/(\d+)\s*mol\/L/g, '$1 mol/L'],
    [/(\d+)\s*atm/g, '$1 atm'],
    [/(\d+)\s*kPa/g, '$1 kPa'],
    [/(\d+)\s*mmHg/g, '$1 mmHg'],
    // Física - Força e energia
    [/(\d+)\s*N\.m/g, '$1 N·m'],
    [/(\d+)\s*N·m/g, '$1 N·m'],
    [/(\d+)\s*W\/m²/g, '$1 W/m²'],
    [/(\d+)\s*J\/kg/g, '$1 J/kg'],
    [/(\d+)\s*cal\/g/g, '$1 cal/g'],
    [/(\d+)\s*kcal/g, '$1 kcal'],
    // Eletricidade
    [/(\d+)\s*V\/m/g, '$1 V/m'],
    [/(\d+)\s*A\/m/g, '$1 A/m'],
    [/(\d+)\s*Ω/g, '$1 Ω'],
    [/(\d+)\s*ohms?/gi, '$1 Ω'],
    [/(\d+)\s*mA/g, '$1 mA'],
    [/(\d+)\s*μA/g, '$1 μA'],
    [/(\d+)\s*kV/g, '$1 kV'],
    [/(\d+)\s*mV/g, '$1 mV'],
    [/(\d+)\s*μF/g, '$1 μF'],
    [/(\d+)\s*pF/g, '$1 pF'],
    // Frequência e ondas
    [/(\d+)\s*Hz/g, '$1 Hz'],
    [/(\d+)\s*kHz/g, '$1 kHz'],
    [/(\d+)\s*MHz/g, '$1 MHz'],
    [/(\d+)\s*GHz/g, '$1 GHz'],
    // Massa e densidade
    [/(\d+)\s*g\/cm³/g, '$1 g/cm³'],
    [/(\d+)\s*kg\/m³/g, '$1 kg/m³'],
    [/(\d+)\s*g\/mL/g, '$1 g/mL'],
    // Tempo
    [/(\d+)\s*ms/g, '$1 ms'],
    [/(\d+)\s*μs/g, '$1 μs'],
    [/(\d+)\s*ns/g, '$1 ns'],
    // Luz e radiação
    [/(\d+)\s*nm/g, '$1 nm'],
    [/(\d+)\s*μm/g, '$1 μm'],
    [/(\d+)\s*cd/g, '$1 cd'],
    [/(\d+)\s*lux/g, '$1 lux'],

    // ═══════════════════════════════════════════════════════════════════════════
    // NOTAÇÃO CIENTÍFICA
    // ═══════════════════════════════════════════════════════════════════════════
    [/(\d+)\s*[xX×]\s*10\^(\d+)/g, '$1 \\times 10^{$2}'],
    [/(\d+)\s*[xX×]\s*10\^(-?\d+)/g, '$1 \\times 10^{$2}'],
    [/(\d+[,\.]\d+)\s*[xX×]\s*10\^(-?\d+)/g, '$1 \\times 10^{$2}'],

    // Fórmulas químicas comuns - Ácidos
    [/\bH2SO4\b/g, 'H₂SO₄'],
    [/\bH3PO4\b/g, 'H₃PO₄'],
    [/\bHNO3\b/g, 'HNO₃'],
    [/\bHCl\b/g, 'HCl'],
    [/\bH2CO3\b/g, 'H₂CO₃'],
    [/\bH2S\b/g, 'H₂S'],
    [/\bH2O2\b/g, 'H₂O₂'],
    // Bases
    [/\bCa\(OH\)2\b/g, 'Ca(OH)₂'],
    [/\bMg\(OH\)2\b/g, 'Mg(OH)₂'],
    [/\bAl\(OH\)3\b/g, 'Al(OH)₃'],
    [/\bFe\(OH\)2\b/g, 'Fe(OH)₂'],
    [/\bFe\(OH\)3\b/g, 'Fe(OH)₃'],
    [/\bNH4OH\b/g, 'NH₄OH'],
    // Sais
    [/\bCaCO3\b/g, 'CaCO₃'],
    [/\bNa2CO3\b/g, 'Na₂CO₃'],
    [/\bNaHCO3\b/g, 'NaHCO₃'],
    [/\bCaSO4\b/g, 'CaSO₄'],
    [/\bBaSO4\b/g, 'BaSO₄'],
    [/\bAgNO3\b/g, 'AgNO₃'],
    [/\bFeCl3\b/g, 'FeCl₃'],
    [/\bFeCl2\b/g, 'FeCl₂'],
    [/\bKMnO4\b/g, 'KMnO₄'],
    [/\bK2Cr2O7\b/g, 'K₂Cr₂O₇'],
    [/\bNa2SO4\b/g, 'Na₂SO₄'],
    // Óxidos
    [/\bCO2\b/g, 'CO₂'],
    [/\bH2O\b/g, 'H₂O'],
    [/\bSO2\b/g, 'SO₂'],
    [/\bSO3\b/g, 'SO₃'],
    [/\bNO2\b/g, 'NO₂'],
    [/\bN2O\b/g, 'N₂O'],
    [/\bN2O4\b/g, 'N₂O₄'],
    [/\bN2O5\b/g, 'N₂O₅'],
    [/\bFe2O3\b/g, 'Fe₂O₃'],
    [/\bFe3O4\b/g, 'Fe₃O₄'],
    [/\bAl2O3\b/g, 'Al₂O₃'],
    [/\bSiO2\b/g, 'SiO₂'],
    [/\bP2O5\b/g, 'P₂O₅'],
    // Gases
    [/\bO2\b/g, 'O₂'],
    [/\bO3\b/g, 'O₃'],
    [/\bN2\b/g, 'N₂'],
    [/\bH2\b/g, 'H₂'],
    [/\bCl2\b/g, 'Cl₂'],
    [/\bF2\b/g, 'F₂'],
    [/\bNH3\b/g, 'NH₃'],
    // Compostos orgânicos
    [/\bCH4\b/g, 'CH₄'],
    [/\bC2H6\b/g, 'C₂H₆'],
    [/\bC2H4\b/g, 'C₂H₄'],
    [/\bC2H2\b/g, 'C₂H₂'],
    [/\bC3H8\b/g, 'C₃H₈'],
    [/\bC6H12O6\b/g, 'C₆H₁₂O₆'],
    [/\bC2H5OH\b/g, 'C₂H₅OH'],
    [/\bCH3OH\b/g, 'CH₃OH'],
    [/\bCH3COOH\b/g, 'CH₃COOH'],
    [/\bC6H6\b/g, 'C₆H₆'],
    // Íons comuns
    [/\bNH4\+/g, 'NH₄⁺'],
    [/\bSO4\^?2-/g, 'SO₄²⁻'],
    [/\bNO3-/g, 'NO₃⁻'],
    [/\bCO3\^?2-/g, 'CO₃²⁻'],
    [/\bHCO3-/g, 'HCO₃⁻'],
    [/\bPO4\^?3-/g, 'PO₄³⁻'],
    [/\bOH-/g, 'OH⁻'],
    [/\bMnO4-/g, 'MnO₄⁻'],
    [/\bFe\^?2\+/g, 'Fe²⁺'],
    [/\bFe\^?3\+/g, 'Fe³⁺'],
    [/\bCu\^?2\+/g, 'Cu²⁺'],
    [/\bZn\^?2\+/g, 'Zn²⁺'],
    [/\bAl\^?3\+/g, 'Al³⁺'],
    [/\bCa\^?2\+/g, 'Ca²⁺'],
    [/\bMg\^?2\+/g, 'Mg²⁺'],
    [/\bNa\+/g, 'Na⁺'],
    [/\bK\+/g, 'K⁺'],
    [/\bH\+/g, 'H⁺'],
    [/\bCl-/g, 'Cl⁻'],

    // ═══════════════════════════════════════════════════════════════════════════
    // REAÇÕES QUÍMICAS
    // ═══════════════════════════════════════════════════════════════════════════
    [/<=>/g, '⇌'],
    [/->/g, '→'],
    [/<->/g, '↔'],
    [/=>/g, '⇒'],
    [/\(aq\)/g, '₍ₐ₎'],
    [/\(s\)/g, '₍ₛ₎'],
    [/\(l\)/g, '₍ₗ₎'],
    [/\(g\)/g, '₍₉₎'],

    // ═══════════════════════════════════════════════════════════════════════════
    // SÍMBOLOS MATEMÁTICOS
    // ═══════════════════════════════════════════════════════════════════════════
    [/(\d+)%/g, '$1%'],
    [/\+-/g, '±'],
    [/>=/g, '≥'],
    [/<=/g, '≤'],
    [/!=/g, '≠'],
    [/~=/g, '≈'],
    // Letras gregas - apenas em contexto matemático/científico isolado
    // Evita substituir em palavras como "município", "alfabeto", etc.
    [/(?<=[\s=+\-*/():])\bpi\b(?=[\s=+\-*/():,.]|$)/g, 'π'],
    [/(?<=[\s=:])\balpha\b(?=[\s=,.]|$)/g, 'α'],
    [/(?<=[\s=:])\bbeta\b(?=[\s=,.]|$)/g, 'β'],
    [/(?<=[\s=:])\bgamma\b(?=[\s=,.]|$)/g, 'γ'],
    [/(?<=[\s=:])\bdelta\b(?=[\s=,.]|$)/g, 'Δ'],
    [/(?<=[\s=:])\btheta\b(?=[\s=,.]|$)/g, 'θ'],
    [/(?<=[\s=:])\blambda\b(?=[\s=,.]|$)/g, 'λ'],
    [/(?<=[\s=:])\bsigma\b(?=[\s=,.]|$)/g, 'σ'],
    [/(?<=[\s=:])\bomega\b(?=[\s=,.]|$)/g, 'ω'],
    // NOTA: "mu", "rho", "phi", "epsilon" removidos por causar falsos positivos

    // ═══════════════════════════════════════════════════════════════════════════
    // FÍSICA - VETORES E CONSTANTES
    // ═══════════════════════════════════════════════════════════════════════════
    // Constantes físicas
    [/\bc\s*=\s*3\s*[xX×]\s*10\^8/g, 'c = 3×10⁸ m/s'],
    [/\bg\s*=\s*10\s*m\/s/g, 'g = 10 m/s²'],
    [/\bg\s*=\s*9[,.]8/g, 'g = 9,8 m/s²'],

    // ═══════════════════════════════════════════════════════════════════════════
    // BIOLOGIA - NOMENCLATURA CIENTÍFICA
    // ═══════════════════════════════════════════════════════════════════════════
    // Formato: Genus species (primeira maiúscula, resto minúscula)
    // Espécies comuns em questões ENEM
    [/\b(Homo\s+sapiens)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Escherichia\s+coli)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Trypanosoma\s+cruzi)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Plasmodium\s+\w+)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Aedes\s+aegypti)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Apis\s+mellifera)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Zea\s+mays)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Saccharomyces\s+cerevisiae)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Oryza\s+sativa)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Glycine\s+max)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Coffea\s+arabica)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Manihot\s+esculenta)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Anopheles\s+\w+)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Leishmania\s+\w+)\b/g, '<em class="nome-cientifico">$1</em>'],
    [/\b(Schistosoma\s+mansoni)\b/g, '<em class="nome-cientifico">$1</em>'],
    // NOTA: Removido padrão genérico de nomenclatura binomial (causava falsos positivos)

    // Sequências de DNA/RNA (apenas sequências longas e isoladas)
    [/\b([ATCG]{6,})\b/g, '<span class="sequencia-dna">$1</span>'],
    [/\b([AUCG]{6,})\b/g, '<span class="sequencia-rna">$1</span>'],

    // ═══════════════════════════════════════════════════════════════════════════
    // GEOGRAFIA - COORDENADAS
    // ═══════════════════════════════════════════════════════════════════════════
    [/(\d+)°(\d+)'([NS])/g, '$1°$2\'$3'],
    [/(\d+)°(\d+)'([EWO])/g, '$1°$2\'$3'],
    [/(\d+)°(\d+)'(\d+)"([NS])/g, '$1°$2\'$3"$4'],
    [/(\d+)°(\d+)'(\d+)"([EWO])/g, '$1°$2\'$3"$4'],

    // ═══════════════════════════════════════════════════════════════════════════
    // FILOSOFIA/SOCIOLOGIA - TERMOS TÉCNICOS
    // ═══════════════════════════════════════════════════════════════════════════
    // Termos gregos/latinos em itálico
    [/\b(a priori)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(a posteriori)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(logos)\b/g, '<em class="termo-filosofico">$1</em>'],
    [/\b(ethos)\b/g, '<em class="termo-filosofico">$1</em>'],
    [/\b(pathos)\b/g, '<em class="termo-filosofico">$1</em>'],
    [/\b(habitus)\b/g, '<em class="termo-filosofico">$1</em>'],
    [/\b(status quo)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(modus operandi)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(lato sensu)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(stricto sensu)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(in loco)\b/gi, '<em class="termo-filosofico">$1</em>'],
    [/\b(ipsis litteris)\b/gi, '<em class="termo-filosofico">$1</em>'],
  ]

  for (const [padrao, substituicao] of substituicoes) {
    resultado = resultado.replace(padrao, substituicao)
  }

  // Restaurar valores monetários
  resultado = restaurarValoresMonetarios(resultado)

  return resultado
}

export default function ConteudoQuestao({
  conteudo,
  tipo = 'contexto',
  className = '',
  separarFonte = true
}: ConteudoQuestaoProps) {

  // Separar corpo e fonte/referência
  const { corpo, fonte } = useMemo(() => {
    if (!conteudo || tipo !== 'contexto' || !separarFonte) {
      return { corpo: conteudo, fonte: null }
    }
    return separarTextoEFonte(conteudo)
  }, [conteudo, tipo, separarFonte])

  // Detectar gênero textual para aplicar estilos apropriados
  const generoTextual = useMemo(() => {
    if (tipo !== 'contexto') return 'prosa' as GeneroTextual
    return detectarGeneroTextual(corpo)
  }, [corpo, tipo])

  const conteudoProcessado = useMemo(() => {
    if (!corpo) return ''

    let texto = corpo

    // Aplicar formatação específica por gênero textual (poema, diálogo, citação)
    if (tipo === 'contexto' && generoTextual !== 'prosa') {
      texto = formatarPorGenero(texto, generoTextual)
    }

    // Formatar símbolos especiais
    texto = formatarSimbolos(texto)

    // Converter HTML para Markdown
    texto = htmlParaMarkdown(texto)

    return texto
  }, [corpo, tipo, generoTextual])

  const usarMarkdown = useMemo(() => {
    // Usar Markdown se contiver LaTeX ou formatação Markdown
    return contemLatex(conteudoProcessado) ||
           conteudoProcessado.includes('**') ||
           conteudoProcessado.includes('*') ||
           conteudoProcessado.includes('$')
  }, [conteudoProcessado])

  // Estilos baseados no tipo de conteúdo
  const estilosBase = {
    contexto: 'text-sm sm:text-base leading-relaxed questao-texto',
    comando: 'text-sm sm:text-base font-medium leading-relaxed',
    alternativa: 'text-sm leading-snug',
    fonte: 'text-xs leading-relaxed opacity-70',
  }

  // Classes adicionais baseadas no gênero textual
  const classesGenero: Record<GeneroTextual, string> = {
    prosa: '',
    poema: 'questao-poema',
    citacao: 'questao-citacao-container',
    cientifico: 'questao-cientifico',
    dialogo: 'questao-dialogo',
    lista: 'questao-lista',
    noticia: 'questao-noticia-container',
    carta: 'questao-carta-container',
    anuncio: 'questao-anuncio-container',
    documento: 'questao-documento-container',
    tirinha: 'questao-tirinha-container',
    artigo_lei: 'questao-artigo-lei-container',
    entrevista: 'questao-entrevista-container',
    letra_musica: 'questao-letra-musica-container',
    infografico: 'questao-infografico-container',
  }

  const estiloTipo = estilosBase[tipo] || estilosBase.contexto
  const classeGenero = classesGenero[generoTextual] || ''

  // Componente de fonte/referência (renderizado abaixo do texto)
  const FonteComponent = fonte ? (
    <div className="questao-fonte-container">
      <p className="questao-fonte-linha">{fonte}</p>
    </div>
  ) : null

  // Se não precisa de Markdown/LaTeX, usar renderização HTML direta
  if (!usarMarkdown) {
    return (
      <div className={`conteudo-questao-wrapper ${classeGenero}`}>
        <div
          className={`conteudo-questao ${estiloTipo} ${className}`}
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: corpo }}
        />
        {FonteComponent}
      </div>
    )
  }

  // Renderizar com ReactMarkdown + KaTeX + rehype-raw (para HTML inline)
  return (
    <div className={`conteudo-questao-wrapper ${classeGenero}`}>
      <div
        className={`conteudo-questao ${estiloTipo} ${className}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            // Parágrafos
            p: ({ children }) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
            // Negrito
            strong: ({ children }) => (
              <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {children}
              </strong>
            ),
            // Itálico (usado para descrições de imagens)
            em: ({ children }) => (
              <em className="italic" style={{ color: 'var(--text-secondary)' }}>
                {children}
              </em>
            ),
            // Spans com classes especiais (fontes, referências, títulos)
            span: ({ className: spanClass, children }) => {
              if (spanClass === 'questao-fonte') {
                return (
                  <span className="questao-fonte block text-right mt-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'questao-titulo' || spanClass === 'titulo-texto') {
                return (
                  <span className="questao-titulo-texto" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'ref-figura') {
                return (
                  <span className="ref-figura text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'ref-tabela') {
                return (
                  <span className="ref-tabela text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {children}
                  </span>
                )
              }
              return <span className={spanClass}>{children}</span>
            },
            // Títulos h3 e h4 para títulos de textos - PADRÃO ENEM: centralizado e negrito
            h3: ({ children }) => (
              <h3 className="questao-titulo-texto" style={{ color: 'var(--text-primary)' }}>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="questao-titulo-texto" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {children}
              </h4>
            ),
            // Listas
            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm">{children}</li>
            ),
            // Código (para fórmulas que não são LaTeX)
            code: ({ children, className: codeClass }) => {
              if (codeClass) {
                return (
                  <code
                    className="block p-2 rounded my-2 text-xs overflow-x-auto font-mono"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <code
                  className="px-1 py-0.5 rounded text-xs font-mono"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {children}
                </code>
              )
            },
            // Tabelas
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ border: '1px solid var(--border-default)' }}
                >
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ background: 'var(--bg-elevated)' }}>
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th
                className="px-3 py-2 text-left font-semibold text-xs"
                style={{ border: '1px solid var(--border-default)' }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                className="px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border-default)' }}
              >
                {children}
              </td>
            ),
            // Blockquote (usado para citações longas - recuo 4cm)
            blockquote: ({ children }) => (
              <blockquote
                className="questao-citacao pl-4 my-3 text-sm"
                style={{
                  marginLeft: '2.5rem',
                  paddingLeft: '1rem',
                  borderLeft: '3px solid var(--color-accent)',
                  color: 'var(--text-secondary)',
                  fontStyle: 'normal',
                  lineHeight: '1.5',
                }}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {conteudoProcessado}
        </ReactMarkdown>
      </div>
      {FonteComponent}
    </div>
  )
}

// Componentes auxiliares foram movidos para @/components/questao/
// Importar de lá: FormulaLatex, DescricaoImagem, FonteReferencia, TituloTexto
