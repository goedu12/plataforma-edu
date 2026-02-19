# PLANO DE FORMATACAO E VALIDACAO - QUESTOES ENEM
## Analise Senior - Plataforma Educacional

**Data:** 2026-02-18
**Analista:** Claude (Opus 4.5)
**Branch:** `claude/format-enem-questions-YdwzH`

---

## 1. DIAGNOSTICO ATUAL

### 1.1 Estrutura de Dados
As questoes ENEM estao armazenadas na tabela `questoes_enem` com a seguinte estrutura:

```typescript
interface QuestaoEnem {
  id: string
  ano: number
  dia: number
  area: string  // "Linguagens", "Humanas", "Natureza", "Matematica"
  elementos: ElementoEnem[]  // Array JSONB com estrutura da questao
  comando: string | null
  alt_a_texto/imagem, alt_b_texto/imagem, ... alt_e_texto/imagem
  gabarito: string
}

interface ElementoEnem {
  tipo: 'texto' | 'imagem' | 'comando' | 'titulo' | 'fonte'
  conteudo?: string
  arquivo?: string  // URL para imagens
}
```

### 1.2 Problemas Identificados

| Problema | Impacto | Prioridade |
|----------|---------|------------|
| Fontes/referencias nao separadas do texto | Dificil leitura | ALTA |
| Imagens com URLs invalidas ou quebradas | Questoes inutilizaveis | ALTA |
| Falta de recuo em paragrafos | Nao segue padrao INEP | MEDIA |
| Citacoes sem formatacao adequada | Confusao visual | MEDIA |
| Poemas sem quebra de verso correta | Perde estrutura | ALTA |
| Formulas quimicas/matematicas mal formatadas | Erro conceitual | ALTA |

---

## 2. REGRAS DE FORMATACAO POR GENERO TEXTUAL

### 2.1 Prosa (Texto corrido)
- **Recuo:** 1.25cm na primeira linha de cada paragrafo
- **Espacamento:** 1.5 entre linhas
- **Alinhamento:** Justificado
- **Fonte/Referencia:** Uma linha em branco ABAIXO do texto, alinhado a direita, italico

```css
.questao-prosa p {
  text-indent: 1.25rem;
  line-height: 1.6;
  text-align: justify;
  margin-bottom: 0.5rem;
}

.questao-fonte {
  display: block;
  margin-top: 0.75rem;
  text-align: right;
  font-style: italic;
  font-size: 0.75rem;
  color: var(--text-muted);
}
```

### 2.2 Poesia/Verso
- **Recuo:** Nenhum (alinhado a esquerda)
- **Quebra:** Cada verso em linha separada
- **Estrofes:** Linha em branco entre estrofes
- **Titulo:** Centralizado, negrito

```css
.questao-poema {
  font-family: serif;
  line-height: 1.4;
}

.questao-verso {
  display: block;
  padding-left: 2rem;
}

.questao-estrofe {
  margin-bottom: 1rem;
}
```

### 2.3 Citacao Direta (mais de 3 linhas)
- **Recuo:** 4cm da margem esquerda
- **Fonte:** Tamanho menor (10pt equivalente)
- **Espacamento:** Simples
- **Sem aspas**

```css
.questao-citacao-longa {
  margin-left: 2.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.4;
  border-left: 3px solid var(--border-default);
  background: var(--bg-elevated);
}
```

### 2.4 Texto Cientifico (Formulas)
- **Formulas inline:** Mantidas no fluxo do texto
- **Formulas em bloco:** Centralizadas, com espacamento
- **Unidades:** Sempre com espaco apos o numero
- **Notacao cientifica:** Usando sobrescrito Unicode ou LaTeX

### 2.5 Tabelas e Graficos
- **Titulo:** ACIMA da tabela/grafico
- **Fonte:** ABAIXO, alinhada a esquerda
- **Bordas:** Simples, sem cores

---

## 3. IMPLEMENTACAO TECNICA

### 3.1 Componente ConteudoQuestao (Melhorias)

```typescript
// src/components/ConteudoQuestao.tsx

// Detectar genero textual automaticamente
function detectarGeneroTextual(texto: string): 'prosa' | 'poema' | 'citacao' | 'cientifico' | 'tabela' {
  // Poema: linhas curtas (< 60 chars) em sequencia
  const linhas = texto.split('\n')
  const linhasCurtas = linhas.filter(l => l.trim().length > 0 && l.trim().length < 60)
  if (linhasCurtas.length > 3 && linhasCurtas.length / linhas.length > 0.6) {
    return 'poema'
  }

  // Citacao: comeca com aspas ou tem indicador
  if (/^[""\[\(]/.test(texto.trim()) || /apud|op\. cit\.|ibidem/i.test(texto)) {
    return 'citacao'
  }

  // Cientifico: contem formulas ou simbolos
  if (/\$.*\$|\\frac|\\sqrt|[°±≤≥→⇌]|mol\/L|m\/s/.test(texto)) {
    return 'cientifico'
  }

  // Tabela: contem pipes ou estrutura tabulada
  if (/\|.*\||\t.*\t/.test(texto)) {
    return 'tabela'
  }

  return 'prosa'
}
```

### 3.2 Separacao de Fontes/Referencias

```typescript
// src/lib/limpezaTexto.ts - MELHORIAS

export function separarFonteDoTexto(html: string): {
  corpo: string
  fonte: string | null
} {
  // Padroes que indicam fonte/referencia:
  const padroesFonte = [
    // ABNT: SOBRENOME, Nome. Titulo. Local: Editora, ano.
    /\n([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+,\s*[A-Z].*\d{4}.*)/,
    // Adaptado de...
    /\n(\(?[Aa]daptado\)?.*)/,
    // Disponivel em: URL
    /\n(Dispon[ií]vel\s+em:.*)/i,
    // Revista/Jornal, ano
    /\n((Revista|Jornal|Folha).*\d{4}.*)/i,
    // In: TITULO
    /\n(In:\s+.*)/,
    // (Fonte: ...)
    /\n?\(?(Fonte:\s+[^)]+)\)?/i,
  ]

  let corpo = html
  let fonte: string | null = null

  for (const padrao of padroesFonte) {
    const match = corpo.match(padrao)
    if (match) {
      fonte = match[1].trim()
      corpo = corpo.replace(padrao, '')
      break
    }
  }

  return { corpo: corpo.trim(), fonte }
}
```

### 3.3 CSS Global para Formatacao

```css
/* src/app/globals.css - ADICOES */

/* === FORMATACAO QUESTOES ENEM === */

/* Recuo de paragrafo padrao ENEM */
.questao-texto p {
  text-indent: 1.25rem;
  text-align: justify;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Fonte/Referencia - UMA LINHA ABAIXO */
.questao-fonte {
  display: block;
  margin-top: 1rem;
  padding-top: 0.5rem;
  text-align: right;
  font-style: italic;
  font-size: 0.75rem;
  color: var(--text-muted);
  border-top: none;
}

/* Poema/Verso */
.questao-poema {
  padding-left: 1.5rem;
  font-family: Georgia, serif;
}

.questao-poema .verso {
  display: block;
  line-height: 1.4;
}

.questao-poema .estrofe {
  margin-bottom: 1rem;
}

/* Citacao longa (recuo 4cm) */
.questao-citacao {
  margin: 1rem 0 1rem 2.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.4;
  border-left: 3px solid var(--color-accent);
  background: var(--bg-elevated);
}

/* Titulo de texto */
.questao-titulo-texto {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

/* Secao TEXTO I, TEXTO II */
.secao-texto-header {
  font-weight: 700;
  font-size: 0.875rem;
  margin: 1rem 0 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-elevated);
  border-radius: 0.25rem;
  display: inline-block;
}
```

---

## 4. VALIDACAO DE IMAGENS

### 4.1 Processo de Validacao Cruzada

1. **Extrair todas URLs** de imagens do banco
2. **Testar HTTP HEAD** para verificar acessibilidade
3. **Verificar Content-Type** para confirmar que e imagem
4. **Comparar com fonte original** (api.enem.dev ou INEP)
5. **Marcar questoes** com imagens quebradas para revisao

### 4.2 Script de Validacao

```bash
# Executar diagnostico de imagens
npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls

# Corrigir URLs invalidas
npx tsx scripts/diagnostico-imagens-supabase.ts --fix

# Limpar URLs quebradas
npx tsx scripts/diagnostico-imagens-supabase.ts --clean-broken
```

### 4.3 Acoes para Imagens Erradas

| Status | Acao |
|--------|------|
| URL invalida (nan, null, etc) | Remover (SET NULL) |
| URL quebrada (404, 500) | Buscar alternativa ou remover |
| URL localhost/file:// | Remover |
| Imagem errada (conteudo diferente) | Buscar imagem correta na API INEP |

---

## 5. PLANO DE REVISAO POR AREA

### 5.1 Matematica e suas Tecnologias
**Foco:**
- Formulas LaTeX renderizando corretamente
- Graficos e tabelas com fonte abaixo
- Notacao cientifica (10^x)
- Simbolos matematicos (≥, ≤, ±, √)
- Unidades de medida com espaco

**Verificacoes:**
- [ ] Fracoes renderizando (\frac{}{})
- [ ] Raizes quadradas (\sqrt{})
- [ ] Potencias e indices
- [ ] Graficos de funcoes
- [ ] Geometria (figuras)

### 5.2 Ciencias da Natureza
**Foco:**
- Formulas quimicas (H₂O, CO₂, NH₃)
- Equacoes de reacao (→, ⇌)
- Unidades SI
- Diagramas e esquemas
- Tabelas de dados experimentais

**Verificacoes:**
- [ ] Formulas quimicas com subscrito
- [ ] Ions com carga (Fe³⁺, SO₄²⁻)
- [ ] Constantes fisicas
- [ ] Graficos de experimentos
- [ ] Ciclos biologicos

### 5.3 Ciencias Humanas
**Foco:**
- Textos historicos com citacao adequada
- Mapas e graficos estatisticos
- Fontes primarias destacadas
- Periodos/datas em destaque

**Verificacoes:**
- [ ] Citacoes de documentos historicos
- [ ] Mapas legiveís
- [ ] Graficos demograficos
- [ ] Charges e tirinhas
- [ ] Textos filosoficos

### 5.4 Linguagens e Codigos
**Foco:**
- Poemas com estrutura de verso
- Textos literarios com recuo
- Tirinhas e charges
- Textos jornalisticos
- Anuncios publicitarios

**Verificacoes:**
- [ ] Poemas com quebra de verso
- [ ] Dialogos formatados
- [ ] Generos textuais diversos
- [ ] Imagens de textos visuais
- [ ] Letras de musica

---

## 6. CRONOGRAMA DE EXECUCAO

### Fase 1: Infraestrutura (Prioridade ALTA)
1. Atualizar `ConteudoQuestao.tsx` com deteccao de genero
2. Implementar separacao de fontes no `limpezaTexto.ts`
3. Adicionar CSS de formatacao em `globals.css`
4. Executar validacao de imagens

### Fase 2: Formatacao (Prioridade MEDIA)
5. Aplicar regras de recuo e paragrafo
6. Formatar citacoes longas
7. Ajustar poemas e versos
8. Corrigir formulas cientificas

### Fase 3: Revisao por Area (Prioridade MEDIA)
9. Revisar Matematica
10. Revisar Ciencias da Natureza
11. Revisar Ciencias Humanas
12. Revisar Linguagens

### Fase 4: Validacao Final
13. Testar todas as questoes visualmente
14. Corrigir problemas encontrados
15. Documentar padroes aplicados

---

## 7. METRICAS DE SUCESSO

| Metrica | Meta |
|---------|------|
| Questoes com fonte separada | 100% |
| Imagens funcionando | > 95% |
| Formatacao por genero correta | > 90% |
| Recuo de paragrafo aplicado | 100% |
| Formulas renderizando | 100% |

---

## 8. REFERENCIAS

- [Cartilha do Participante ENEM 2024](https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2024_cartilha_do_participante.pdf)
- [Normas ABNT para Formatacao](https://www.normasabnt.org/)
- [Provas e Gabaritos INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos)

---

**Aprovado por:** _________________________________
**Data:** _________________________________
