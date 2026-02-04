# Guia de Formatacao de Questoes ENEM

Este guia estabelece o padrao oficial de formatacao para questoes do ENEM na plataforma educacional.

## Estrutura Padrao de uma Questao

Uma questao ENEM segue a seguinte estrutura:

```
1. **TITULO** (negrito) - Nome da obra, texto ou identificador
2. SUBTITULO (italico) - Linha fina ou descricao breve
3. TEXTO-BASE - Conteudo principal
4. [DESCRICAO DE IMAGEM] - Entre colchetes e em italico
5. FONTE (tamanho menor) - Referencia bibliografica
6. COMANDO - Pergunta antes das alternativas
7. ALTERNATIVAS (A, B, C, D, E)
```

---

## Tags HTML para Formatacao

### Titulo em Negrito
```html
<strong>De proprio punho</strong>
```
**Quando usar:** Titulos de obras literarias, textos jornalisticos, poemas, cancoes.

### Subtitulo em Italico
```html
<em>A escrita e suas tecnologias sofrem interessantes metamorfoses</em>
```
**Quando usar:** Linha fina de artigos, explicacoes breves do contexto.

### Texto com Multiplos Blocos
```html
<strong>TEXTO I</strong>

Primeiro paragrafo do texto I...

<strong>TEXTO II</strong>

Primeiro paragrafo do texto II...
```
**Quando usar:** Questoes que comparam multiplos textos.

### Descricao de Imagem
```html
<em>[Fotografia de uma paisagem urbana com predios ao fundo]</em>
```
**Quando usar:** Descrever imagens quando a URL nao esta disponivel ou como acessibilidade.

### Fonte/Referencia
```html
<small>RIBEIRO, A. E. Disponivel em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).</small>
```
**Quando usar:** SEMPRE ao final do contexto. Obrigatorio para todas as questoes.

---

## Formatos de Fonte

### Livro
```html
<small>SOBRENOME, Nome. Titulo do Livro. Cidade: Editora, Ano.</small>
```
Exemplo:
```html
<small>MACHADO, G. Poesia completa. Rio de Janeiro: Catedra/MEC, 1978.</small>
```

### Site/URL
```html
<small>AUTOR. Disponivel em: URL. Acesso em: DD mes. AAAA (adaptado).</small>
```
Exemplo:
```html
<small>CASTRO, R. Disponivel em: www1.folha.uol.com.br. Acesso em: 3 fev. 2024 (adaptado).</small>
```

### Periodico
```html
<small>Revista Nome, n. XX, mes ano (adaptado).</small>
```
Exemplo:
```html
<small>Revista Lingua Portuguesa, n. 31, maio 2008 (adaptado).</small>
```

### Lei/Documento Oficial
```html
<small>BRASIL. Lei n. XXXX/AAAA. Disponivel em: URL. Acesso em: DD mes. AAAA.</small>
```

---

## Legendas de Figuras

### Obra de Arte
```html
<strong>Figura 1:</strong> PAULA, D. <em>Zeferina.</em> Oleo sobre tela, 59 x 44 cm. Masp, Sao Paulo, 2018.
```

### Grafico/Infografico
```html
<strong>Figura 1:</strong> <em>Grafico de consumo de energia por regiao.</em>
```

### Fotografia
```html
<strong>Figura 1:</strong> <em>Vista aerea do centro de Sao Paulo.</em> Fotografia, 2023.
```

---

## Imagens Responsivas - Melhores Praticas

### Dimensoes Recomendadas

| Tipo | Largura Max | Altura Max | Uso |
|------|-------------|------------|-----|
| Principal | 800px | 600px | Imagem unica do contexto |
| Extra | 500px | 400px | Imagens adicionais em grid |
| Alternativa | 200px | 150px | Imagens nas alternativas |

### Classes CSS Responsivas

```css
/* Imagem principal */
.imagem-principal {
  max-width: 100%;
  height: auto;
  max-height: 50vh;  /* Mobile */
  max-height: 60vh;  /* Desktop */
  object-fit: contain;
}

/* Grid de multiplas imagens */
.grid-imagens {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;  /* Mobile: 1 coluna */
}

@media (min-width: 640px) {
  .grid-imagens {
    grid-template-columns: repeat(2, 1fr);  /* Desktop: 2 colunas */
  }
}
```

### Aspectos Importantes

1. **Sempre usar `object-fit: contain`** - Evita cortes na imagem
2. **Definir altura maxima relativa ao viewport** - Garante visibilidade em telas pequenas
3. **Permitir ampliacao** - Botao de zoom para detalhes
4. **Fallback para erro** - Exibir mensagem se imagem falhar
5. **Loading state** - Skeleton enquanto carrega

---

## Exemplos Completos

### Questao com Texto Simples
```sql
UPDATE questoes_enem SET contexto =
'<strong>De proprio punho</strong>

<em>A escrita e suas tecnologias sofrem interessantes metamorfoses</em>

Estranhei muito na primeira vez que escutei a expressao "de proprio punho".
Parecia que eu ia bater em alguem. Nao era bem o caso...

<small>RIBEIRO, A. E. Disponivel em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).</small>',
comando = 'No que diz respeito ao genero bilhete, a autora dessa cronica'
WHERE id = 'xxx';
```

### Questao com Multiplos Textos
```sql
UPDATE questoes_enem SET contexto =
'<strong>TEXTO I</strong>

A Ilha do Ferro, situada a 18 km do municipio de Pao de Acucar, nao e uma ilha, como o nome indica...

<small>Disponivel em: www.imaterial.art.br. Acesso em: 5 fev. 2025 (adaptado).</small>

<strong>TEXTO II</strong>

<em>[Fotografia de escultura em madeira com figuras humanas sobre uma base]</em>

FARIAS, Y. <em>Bailarino entalhado em gravetos de madeira.</em> Artesanato em madeira, 20 x 13 x 51 cm. Ilha do Ferro (AL).

<small>Disponivel em: www.nidelins.com.br. Acesso em: 5 fev. 2025.</small>',
comando = 'A originalidade do trabalho dos artistas da Ilha do Ferro se da pela'
WHERE id = 'xxx';
```

### Questao com Imagem
```sql
UPDATE questoes_enem SET
contexto = '<em>[Cartaz publicitario da UNICEF Brasil dividido em duas partes com fotos de rostos de criancas]</em>

<strong>Parte superior:</strong>
- Foto de um menino indigena: <em>"Carlos Pataxicore, aos 36 anos, medico e o futuro todo pela frente."</em>
- Foto de uma menina negra: <em>"Quezia Silva, aos 29 anos, advogada e o futuro todo pela frente."</em>

<strong>Parte inferior:</strong>
<strong>EM UM MUNDO DE DIFERENCAS ENXERGUE A IGUALDADE</strong>

<em>O Brasil tem 31 milhoes de criancas negras e indigenas...</em>

<small>Disponivel em: www.unicef.org.br. Acesso em: 15 jan. 2024 (adaptado).</small>',
imagem_principal = 'https://exemplo.com/cartaz-unicef.jpg',
comando = 'Nesse cartaz, a utilizacao de frases que projetam a vida profissional de duas criancas tem como objetivo'
WHERE id = 'xxx';
```

### Questao com Poema
```sql
UPDATE questoes_enem SET contexto =
'<strong>Simbolos</strong>

Eu e tu, ante a noite e o amplo desdobramento
do mar, fero, a estourar de encontro a rocha nua...
Um simbolo descubro aqui, neste momento
esta rocha, este mar... a minha vida e a tua.

O mar vem, o mar vai, nele ha o gesto violento
de quem maltrata e, apos, se arrepende e recua.
Como compreendo bem da rocha o sentimento!
Sao muito iguais, por certo, a minha magoa e a sua.

<small>MACHADO, G. Poesia completa. Rio de Janeiro: Catedra/MEC, 1978.</small>',
comando = 'Nesse soneto, os tracos da estetica simbolista sao resgatados pelo eu lirico ao'
WHERE id = 'xxx';
```

### Questao com Lei/Artigo
```sql
UPDATE questoes_enem SET contexto =
'<strong>Art. 26-A.</strong> Nos estabelecimentos de ensino fundamental e medio, oficiais e particulares, torna-se obrigatorio o ensino sobre Historia e Cultura Afro-Brasileira.

<strong>§ 1o</strong> O conteudo programatico a que se refere o caput deste artigo incluira o estudo da Historia da Africa e dos Africanos...

<strong>§ 2o</strong> Os conteudos referentes a Historia e Cultura Afro-Brasileira serao ministrados no ambito de todo o curriculo escolar...

<small>BRASIL. Lei n. 10.639/2003. Disponivel em: www.gov.br/planalto. Acesso em: 5 maio 2024.</small>',
comando = 'O emprego da norma-padrao e justificado nesse texto'
WHERE id = 'xxx';
```

---

## Checklist de Validacao

Antes de salvar uma questao, verifique:

- [ ] **Titulo formatado** - `<strong>Titulo</strong>` quando aplicavel
- [ ] **Fonte presente** - `<small>...</small>` obrigatoria
- [ ] **Comando claro** - Termina com pontuacao (?, :, .)
- [ ] **Descricoes de imagem** - `<em>[descricao]</em>` quando necessario
- [ ] **Paragrafos separados** - Uma linha em branco entre paragrafos
- [ ] **Sem quebras excessivas** - Maximo 2 linhas em branco consecutivas
- [ ] **Alternativas completas** - 5 alternativas (A, B, C, D, E)
- [ ] **Resposta correta definida** - A, B, C, D ou E

---

## Usando o Helper TypeScript

```typescript
import { montarContexto, formatarFonte, formatarLegendaFigura } from '@/lib/formatarQuestaoENEM'

// Criar contexto formatado
const contexto = montarContexto({
  titulo: "De proprio punho",
  subtitulo: "A escrita e suas tecnologias sofrem interessantes metamorfoses",
  textos: [{
    conteudo: "Estranhei muito na primeira vez que escutei a expressao..."
  }],
  fontes: [{
    autor: "RIBEIRO, A. E.",
    url: "https://rascunho.com.br",
    dataAcesso: "16 jan. 2024",
    adaptado: true
  }]
})

// Validar formatacao
import { validarFormatacao } from '@/lib/formatarQuestaoENEM'

const resultado = validarFormatacao(contexto, comando)
if (!resultado.valido) {
  console.error('Erros:', resultado.erros)
}
if (resultado.avisos.length > 0) {
  console.warn('Avisos:', resultado.avisos)
}
```

---

## Erros Comuns a Evitar

| Erro | Correto |
|------|---------|
| `"Titulo"` sem formatacao | `<strong>Titulo</strong>` |
| `[descricao]` sem italico | `<em>[descricao]</em>` |
| Fonte sem `<small>` | `<small>Fonte...</small>` |
| Multiplas quebras de linha | Maximo 2 linhas em branco |
| Imagem sem descricao alternativa | Sempre incluir `alt` |
| Comando sem pontuacao final | Terminar com ?, : ou . |

---

## Suporte

Para duvidas sobre formatacao, consulte:
- Arquivo: `src/lib/formatarQuestaoENEM.ts`
- Componente: `src/components/enem/ConteudoQuestao.tsx`
- Exemplos: `sql/40_formatacao_questoes_enem_2025_completo.sql`
