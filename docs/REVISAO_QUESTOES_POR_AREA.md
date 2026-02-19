# REVISÃO DE QUESTÕES ENEM POR ÁREA

## Visão Geral

Este documento descreve os critérios de revisão para cada área de conhecimento do ENEM,
garantindo que a formatação esteja de acordo com o padrão INEP.

---

## 1. MATEMÁTICA E SUAS TECNOLOGIAS

### Critérios de Formatação

| Elemento | Formatação Esperada |
|----------|---------------------|
| Fórmulas inline | `$formula$` renderizada com KaTeX |
| Fórmulas em bloco | `$$formula$$` centralizada |
| Frações | `\frac{numerador}{denominador}` |
| Raízes | `\sqrt{x}` ou `\sqrt[n]{x}` |
| Potências | `x^{2}` ou superscrito Unicode ² |
| Unidades | Espaço entre número e unidade (10 m/s) |
| Notação científica | 3×10⁵ ou `3 \times 10^{5}` |

### Verificações Específicas

- [ ] Gráficos de funções com eixos legíveis
- [ ] Figuras geométricas com medidas
- [ ] Tabelas de dados numéricas formatadas
- [ ] Símbolos: ≥, ≤, ≠, ±, ∞, π, √
- [ ] Porcentagens e frações

### Problemas Comuns

1. **Fração quebrada**: `\frac{a}{b` sem fechar chaves
2. **Expoente errado**: `10^12` sem chaves → deve ser `10^{12}`
3. **Unidade colada**: `10m/s` → deve ser `10 m/s`

---

## 2. CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS

### Critérios de Formatação

| Elemento | Formatação Esperada |
|----------|---------------------|
| Fórmulas químicas | H₂O, CO₂, NH₃ (subscrito) |
| Íons | Fe³⁺, SO₄²⁻ (superscrito de carga) |
| Equações de reação | → (seta simples), ⇌ (equilíbrio) |
| Constantes físicas | c = 3×10⁸ m/s |
| Unidades SI | kg, mol, L, J, W, Pa |
| Temperatura | °C ou K (com espaço) |

### Verificações Específicas

- [ ] Ciclos biológicos com setas de direção
- [ ] Cadeias alimentares formatadas
- [ ] Tabelas periódicas parciais
- [ ] Gráficos de experimentos
- [ ] Diagramas de energia

### Fórmulas Químicas Comuns

```
Ácidos: H₂SO₄, HNO₃, H₃PO₄, HCl
Bases: NaOH, Ca(OH)₂, NH₄OH
Sais: NaCl, CaCO₃, Na₂SO₄
Gases: O₂, N₂, CO₂, CH₄
Orgânicos: C₂H₅OH, CH₃COOH, C₆H₁₂O₆
```

### Problemas Comuns

1. **Subscrito não convertido**: `H2O` → deve ser `H₂O`
2. **Seta de reação errada**: `->` → deve ser `→`
3. **Carga de íon errada**: `Fe3+` → deve ser `Fe³⁺`

---

## 3. CIÊNCIAS HUMANAS E SUAS TECNOLOGIAS

### Critérios de Formatação

| Elemento | Formatação Esperada |
|----------|---------------------|
| Citações históricas | Bloco com recuo 4cm |
| Fontes primárias | Itálico + referência ABNT |
| Datas e períodos | Negrito ou destaque |
| Mapas | Legenda abaixo |
| Charges | Fonte do autor abaixo |

### Verificações Específicas

- [ ] Textos de documentos históricos formatados como citação
- [ ] Mapas com legendas legíveis
- [ ] Gráficos estatísticos/demográficos
- [ ] Charges e tirinhas com autoria
- [ ] Textos filosóficos com citação adequada

### Gêneros Textuais Comuns

1. **Documento histórico**: Citação longa, fonte em itálico
2. **Texto jornalístico**: Título em negrito, data destacada
3. **Texto acadêmico**: Citação ABNT, autor-ano
4. **Charge/Tirinha**: Imagem + autor abaixo

### Problemas Comuns

1. **Citação sem recuo**: Textos longos devem ter recuo 4cm
2. **Fonte misturada**: Referência deve estar separada do texto
3. **Data sem destaque**: Períodos históricos devem ser destacados

---

## 4. LINGUAGENS, CÓDIGOS E SUAS TECNOLOGIAS

### Critérios de Formatação

| Elemento | Formatação Esperada |
|----------|---------------------|
| Poemas | Versos separados, estrofes com espaço |
| Prosa literária | Recuo de parágrafo 1.25cm |
| Diálogos | Travessão no início de fala |
| Títulos de obras | Itálico ou aspas |
| Letras de música | Como poema, com estrofes |

### Verificações Específicas

- [ ] Poemas com estrutura de verso preservada
- [ ] Letras de música formatadas
- [ ] Tirinhas com balões legíveis
- [ ] Textos jornalísticos com lead destacado
- [ ] Anúncios publicitários como imagem

### Gêneros Textuais e Formatação

| Gênero | Formatação |
|--------|------------|
| Poema | `questao-poema`, sem recuo, versos em linha |
| Conto/Romance | Prosa com recuo, citação quando necessário |
| Crônica | Prosa com recuo |
| Tirinha | Imagem com autor abaixo |
| Letra de música | Como poema, título em itálico |
| Artigo de opinião | Prosa com recuo |
| Notícia | Título em negrito, lead destacado |

### Problemas Comuns

1. **Poema como prosa**: Versos devem estar em linhas separadas
2. **Estrofe sem espaço**: Estrofes devem ter linha em branco entre elas
3. **Título não destacado**: Títulos de obras em itálico ou aspas
4. **Diálogo sem travessão**: Falas devem começar com travessão

---

## Checklist Geral de Revisão

### Para Todas as Questões

- [ ] Fonte/referência está UMA LINHA ABAIXO do texto
- [ ] Título do texto está destacado (se houver)
- [ ] Imagens têm URL válida
- [ ] Texto está justificado com recuo de parágrafo
- [ ] Gênero textual detectado corretamente

### Para Questões com Imagens

- [ ] URL da imagem funciona (não é 404)
- [ ] Imagem é relevante para a questão
- [ ] Legenda/fonte da imagem presente

### Para Questões com Fórmulas

- [ ] LaTeX renderiza corretamente
- [ ] Símbolos matemáticos/químicos corretos
- [ ] Unidades com espaço adequado

---

## Scripts de Validação

```bash
# Validar todas as questões
npx tsx scripts/validar-formatacao-enem.ts

# Validar por área
npx tsx scripts/validar-formatacao-enem.ts --area "Matemática"
npx tsx scripts/validar-formatacao-enem.ts --area "Natureza"
npx tsx scripts/validar-formatacao-enem.ts --area "Humanas"
npx tsx scripts/validar-formatacao-enem.ts --area "Linguagens"

# Validar amostra
npx tsx scripts/validar-formatacao-enem.ts --sample 50

# Validar imagens
npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls
```

---

## Referências

- [Cartilha do Participante ENEM 2024 - INEP](https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2024_cartilha_do_participante.pdf)
- [Normas ABNT para Formatação](https://www.normasabnt.org/)
- [Provas e Gabaritos INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos)
