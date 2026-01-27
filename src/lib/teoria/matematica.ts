// ═══════════════════════════════════════════════════════════════════════════
// TEORIA DE MATEMÁTICA - ENSINO MÉDIO
// Baseado na Matriz de Habilidades Essenciais 2026
// ═══════════════════════════════════════════════════════════════════════════

import type { Topico, ConteudoSerie, ConteudoBimestre, Formula, Exemplo } from './fisica'
export type { Topico, ConteudoSerie, ConteudoBimestre, Formula, Exemplo }

// ═══════════════════════════════════════════════════════════════════════════
// 1ª SÉRIE - MATEMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

export const MATEMATICA_1_SERIE: ConteudoSerie = {
  serie: 1,
  componente: 'fisica', // Reutilizando tipo, mas é matemática
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Utilizar estratégias, conceitos e procedimentos matemáticos para interpretar situações em diversos contextos.',
      codigoHabilidade: 'EM13MAT301',
      topicos: [
        {
          id: 'conjuntos-numericos',
          titulo: 'Conjuntos Numéricos',
          icone: '🔢',
          resumo: 'Os diferentes tipos de números e suas propriedades.',
          conteudo: [
            'Naturais (ℕ): 0, 1, 2, 3... Usados para contar.',
            'Inteiros (ℤ): ...-2, -1, 0, 1, 2... Incluem negativos.',
            'Racionais (ℚ): Números que podem ser escritos como fração (a/b, b≠0). Incluem decimais finitos e dízimas periódicas.',
            'Irracionais (𝕀): Não podem ser fração. Ex: √2, π, e.',
            'Reais (ℝ): União de racionais e irracionais. Todos os números da reta numérica.',
            'Relação: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ',
          ],
          formulas: [
            {
              expressao: 'ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ',
              descricao: 'Relação de inclusão entre conjuntos',
            },
          ],
          exemplos: [
            {
              enunciado: 'Classifique os números: -5, 0,333..., √9, π, 2/3',
              resolucao: [
                '-5: Inteiro (ℤ) e Racional (ℚ)',
                '0,333... = 1/3: Racional (ℚ) - dízima periódica',
                '√9 = 3: Natural (ℕ), Inteiro (ℤ), Racional (ℚ)',
                'π: Irracional (𝕀) - decimal infinito não periódico',
                '2/3: Racional (ℚ)',
              ],
              resposta: 'Todos são Reais (ℝ).',
            },
          ],
          dicaImportante: 'Toda dízima periódica é racional. Dízimas não periódicas são irracionais.',
        },
        {
          id: 'intervalos',
          titulo: 'Intervalos Numéricos',
          icone: '📐',
          resumo: 'Representação de conjuntos de números reais.',
          conteudo: [
            'Intervalo fechado [a, b]: inclui a e b. Ex: [2, 5] = {x ∈ ℝ | 2 ≤ x ≤ 5}',
            'Intervalo aberto (a, b): exclui a e b. Ex: (2, 5) = {x ∈ ℝ | 2 < x < 5}',
            'Semi-aberto à direita [a, b): inclui a, exclui b.',
            'Semi-aberto à esquerda (a, b]: exclui a, inclui b.',
            'Intervalos infinitos: [a, +∞), (-∞, b], (-∞, +∞) = ℝ',
          ],
          formulas: [
            {
              expressao: '[a, b] = {x ∈ ℝ | a ≤ x ≤ b}',
              descricao: 'Intervalo fechado',
            },
            {
              expressao: '(a, b) = {x ∈ ℝ | a < x < b}',
              descricao: 'Intervalo aberto',
            },
          ],
          exemplos: [
            {
              enunciado: 'Represente em forma de intervalo: "x é maior que 3 e menor ou igual a 7"',
              resolucao: [
                'x > 3: exclui 3 → parêntese (',
                'x ≤ 7: inclui 7 → colchete ]',
                'Resultado: (3, 7]',
              ],
              resposta: '(3, 7]',
            },
          ],
        },
        {
          id: 'proporcionalidade',
          titulo: 'Proporcionalidade Direta e Inversa',
          icone: '⚖️',
          resumo: 'Relações entre grandezas que variam juntas.',
          conteudo: [
            'Diretamente proporcionais: quando uma aumenta, a outra aumenta na mesma proporção. k = y/x (constante).',
            'Inversamente proporcionais: quando uma aumenta, a outra diminui. k = x · y (constante).',
            'Exemplo direto: distância e tempo (velocidade constante).',
            'Exemplo inverso: trabalhadores e tempo para completar obra.',
          ],
          formulas: [
            {
              expressao: 'y = k · x',
              descricao: 'Proporcionalidade direta',
            },
            {
              expressao: 'y = k / x  ou  x · y = k',
              descricao: 'Proporcionalidade inversa',
            },
          ],
          exemplos: [
            {
              enunciado: 'Se 5 trabalhadores fazem uma obra em 12 dias, quantos dias levariam 10 trabalhadores?',
              resolucao: [
                'Mais trabalhadores → menos dias (inversa)',
                'k = 5 × 12 = 60',
                '10 × t = 60',
                't = 6 dias',
              ],
              resposta: '6 dias',
            },
          ],
          conexaoCotidiano: 'Preço e quantidade de produtos é direta. Velocidade e tempo de viagem é inversa.',
        },
        {
          id: 'equacao-1-grau',
          titulo: 'Equações do 1º Grau',
          icone: '➕',
          resumo: 'Equações da forma ax + b = 0.',
          conteudo: [
            'Equação de 1º grau: ax + b = 0, onde a ≠ 0.',
            'Solução: isolar x → x = -b/a.',
            'Problemas práticos: traduzir situações em equações.',
            'Exemplo: "O triplo de um número menos 5 é igual a 10" → 3x - 5 = 10.',
          ],
          formulas: [
            {
              expressao: 'ax + b = 0 → x = -b/a',
              descricao: 'Solução da equação de 1º grau',
            },
          ],
          exemplos: [
            {
              enunciado: 'Uma corrida de táxi custa R$5 de bandeirada mais R$2 por km. Quanto custa uma corrida de 8 km?',
              resolucao: [
                'Preço = bandeirada + (preço por km × km)',
                'P = 5 + 2 × 8',
                'P = 5 + 16 = 21',
              ],
              resposta: 'R$ 21,00',
            },
            {
              enunciado: 'Resolva: 3x - 7 = 2x + 5',
              resolucao: [
                '3x - 2x = 5 + 7',
                'x = 12',
              ],
              resposta: 'x = 12',
            },
          ],
        },
        {
          id: 'sistemas-equacoes',
          titulo: 'Sistemas de Equações',
          icone: '🔗',
          resumo: 'Duas ou mais equações com duas ou mais incógnitas.',
          conteudo: [
            'Sistema de 2 equações com 2 incógnitas: encontrar x e y que satisfaçam ambas.',
            'Método da substituição: isolar uma variável e substituir na outra equação.',
            'Método da adição: somar as equações para eliminar uma variável.',
            'O sistema pode ter: uma solução (retas se cruzam), infinitas (retas coincidentes), nenhuma (retas paralelas).',
          ],
          formulas: [
            {
              expressao: '{ ax + by = c\n  dx + ey = f',
              descricao: 'Sistema linear 2×2',
            },
          ],
          exemplos: [
            {
              enunciado: 'Resolva: { x + y = 10, x - y = 4 }',
              resolucao: [
                'Método da adição:',
                '(x + y) + (x - y) = 10 + 4',
                '2x = 14 → x = 7',
                'Substituindo: 7 + y = 10 → y = 3',
              ],
              resposta: 'x = 7 e y = 3',
            },
          ],
          dicaImportante: 'Na adição, multiplique equações para obter coeficientes opostos e eliminar variáveis.',
        },
        {
          id: 'funcao-conceito',
          titulo: 'Conceito de Função',
          icone: '📊',
          resumo: 'Relação entre dois conjuntos onde cada elemento do domínio tem uma única imagem.',
          conteudo: [
            'Função é uma regra que associa cada elemento de A a um único elemento de B.',
            'Domínio (D): conjunto de entrada (valores de x).',
            'Contradomínio (CD): conjunto de possíveis saídas.',
            'Imagem (Im): subconjunto do contradomínio que realmente é "atingido".',
            'Notação: f: A → B ou y = f(x).',
          ],
          formulas: [
            {
              expressao: 'f: D → CD,  x ↦ f(x)',
              descricao: 'Notação de função',
            },
          ],
          exemplos: [
            {
              enunciado: 'Dada f(x) = 2x + 3, calcule f(4).',
              resolucao: [
                'Substituir x por 4:',
                'f(4) = 2(4) + 3',
                'f(4) = 8 + 3 = 11',
              ],
              resposta: 'f(4) = 11',
            },
          ],
          conexaoCotidiano: 'Preço em função da quantidade, temperatura em função do tempo, nota em função do estudo.',
        },
        {
          id: 'funcao-afim',
          titulo: 'Função Afim (1º Grau)',
          icone: '📈',
          resumo: 'Função da forma f(x) = ax + b, cujo gráfico é uma reta.',
          conteudo: [
            'Forma geral: f(x) = ax + b, onde a e b são constantes.',
            'a = coeficiente angular (inclinação da reta). b = coeficiente linear (onde cruza o eixo y).',
            'Se a > 0: função crescente (reta "sobe").',
            'Se a < 0: função decrescente (reta "desce").',
            'Zero da função: valor de x onde f(x) = 0. É a raiz: x = -b/a.',
          ],
          formulas: [
            {
              expressao: 'f(x) = ax + b',
              descricao: 'Função afim',
              variaveis: [
                { simbolo: 'a', significado: 'Coeficiente angular (taxa de variação)' },
                { simbolo: 'b', significado: 'Coeficiente linear (intercepto em y)' },
              ],
            },
            {
              expressao: 'Zero: x = -b/a',
              descricao: 'Raiz da função afim',
            },
          ],
          exemplos: [
            {
              enunciado: 'Um plano de celular custa R$30 fixo + R$0,50 por minuto. Escreva a função e calcule para 100 minutos.',
              resolucao: [
                'C(m) = 30 + 0,5m (custo em função dos minutos)',
                'Para m = 100:',
                'C(100) = 30 + 0,5 × 100',
                'C(100) = 30 + 50 = 80',
              ],
              resposta: 'C(m) = 30 + 0,5m; Para 100 min: R$ 80,00',
            },
          ],
          dicaImportante: 'O coeficiente angular a representa a taxa de variação: quanto y varia quando x aumenta 1 unidade.',
        },
        {
          id: 'funcao-quadratica',
          titulo: 'Função Quadrática (2º Grau)',
          icone: '🎢',
          resumo: 'Função da forma f(x) = ax² + bx + c, cujo gráfico é uma parábola.',
          conteudo: [
            'Forma geral: f(x) = ax² + bx + c, onde a ≠ 0.',
            'Gráfico: parábola. Se a > 0, concavidade para cima (∪). Se a < 0, para baixo (∩).',
            'Vértice (xv, yv): ponto de máximo ou mínimo da função.',
            'Raízes: valores de x onde f(x) = 0. Fórmula de Bhaskara.',
            'Discriminante Δ = b² - 4ac determina o número de raízes.',
          ],
          formulas: [
            {
              expressao: 'f(x) = ax² + bx + c',
              descricao: 'Função quadrática',
            },
            {
              expressao: 'x = (-b ± √Δ) / 2a',
              descricao: 'Fórmula de Bhaskara',
            },
            {
              expressao: 'Δ = b² - 4ac',
              descricao: 'Discriminante',
            },
            {
              expressao: 'xv = -b/2a, yv = -Δ/4a',
              descricao: 'Coordenadas do vértice',
            },
          ],
          exemplos: [
            {
              enunciado: 'Encontre as raízes de f(x) = x² - 5x + 6.',
              resolucao: [
                'a = 1, b = -5, c = 6',
                'Δ = (-5)² - 4(1)(6) = 25 - 24 = 1',
                'x = (5 ± √1) / 2 = (5 ± 1) / 2',
                'x₁ = 6/2 = 3, x₂ = 4/2 = 2',
              ],
              resposta: 'x = 2 ou x = 3',
            },
          ],
          dicaImportante: 'Se Δ > 0: 2 raízes. Se Δ = 0: 1 raiz (vértice toca o eixo x). Se Δ < 0: nenhuma raiz real.',
        },
        {
          id: 'notacao-cientifica-mat',
          titulo: 'Notação Científica',
          icone: '🔬',
          resumo: 'Representação de números muito grandes ou muito pequenos.',
          conteudo: [
            'Forma: N × 10ⁿ, onde 1 ≤ N < 10 e n é inteiro.',
            'Para números grandes: expoente positivo. Ex: 5.000.000 = 5 × 10⁶.',
            'Para números pequenos: expoente negativo. Ex: 0,00003 = 3 × 10⁻⁵.',
            'Operações: multiplicar/dividir os coeficientes e somar/subtrair expoentes.',
          ],
          formulas: [
            {
              expressao: 'N × 10ⁿ (1 ≤ N < 10)',
              descricao: 'Forma padrão',
            },
          ],
          exemplos: [
            {
              enunciado: 'Calcule: (3 × 10⁴) × (2 × 10⁵)',
              resolucao: [
                'Multiplica coeficientes: 3 × 2 = 6',
                'Soma expoentes: 4 + 5 = 9',
                'Resultado: 6 × 10⁹',
              ],
              resposta: '6 × 10⁹',
            },
          ],
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 2ª SÉRIE - MATEMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

export const MATEMATICA_2_SERIE: ConteudoSerie = {
  serie: 2,
  componente: 'fisica',
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Resolver e elaborar problemas que envolvem medidas de ângulos e conceitos de geometria plana.',
      codigoHabilidade: 'EM13MAT308',
      topicos: [
        {
          id: 'angulos-tipos',
          titulo: 'Ângulos e seus Tipos',
          icone: '📐',
          resumo: 'Classificação e relações entre ângulos.',
          conteudo: [
            'Ângulo: região formada por duas semirretas com mesma origem.',
            'Tipos: agudo (< 90°), reto (= 90°), obtuso (> 90° e < 180°), raso (= 180°).',
            'Ângulos complementares: soma = 90°. Suplementares: soma = 180°.',
            'Ângulos opostos pelo vértice (OPV): são congruentes (iguais).',
            'Ângulos colaterais: mesmo lado da transversal. Alternos: lados opostos.',
          ],
          formulas: [
            {
              expressao: 'α + β = 90°',
              descricao: 'Complementares',
            },
            {
              expressao: 'α + β = 180°',
              descricao: 'Suplementares',
            },
          ],
          exemplos: [
            {
              enunciado: 'Se um ângulo mede 35°, qual é seu complemento e seu suplemento?',
              resolucao: [
                'Complemento: 90° - 35° = 55°',
                'Suplemento: 180° - 35° = 145°',
              ],
              resposta: 'Complemento = 55°, Suplemento = 145°',
            },
          ],
        },
        {
          id: 'angulos-triangulo',
          titulo: 'Ângulos no Triângulo',
          icone: '🔺',
          resumo: 'A soma dos ângulos internos de um triângulo é 180°.',
          conteudo: [
            'Teorema: a soma dos ângulos internos de qualquer triângulo é 180°.',
            'Ângulo externo: é suplementar ao interno adjacente.',
            'Teorema do ângulo externo: o ângulo externo é igual à soma dos dois internos não adjacentes.',
            'Triângulo equilátero: todos ângulos = 60°.',
            'Triângulo retângulo: um ângulo = 90°.',
          ],
          formulas: [
            {
              expressao: 'α + β + γ = 180°',
              descricao: 'Soma dos ângulos internos do triângulo',
            },
            {
              expressao: 'Ext = α + β (não adjacentes)',
              descricao: 'Teorema do ângulo externo',
            },
          ],
          exemplos: [
            {
              enunciado: 'Um triângulo tem ângulos de 50° e 70°. Qual o terceiro ângulo?',
              resolucao: [
                'Soma dos internos = 180°',
                '50° + 70° + x = 180°',
                'x = 180° - 120° = 60°',
              ],
              resposta: '60°',
            },
          ],
        },
        {
          id: 'poligonos-regulares',
          titulo: 'Polígonos Regulares',
          icone: '⬡',
          resumo: 'Polígonos com todos os lados e ângulos iguais.',
          conteudo: [
            'Polígono regular: lados congruentes e ângulos congruentes.',
            'Soma dos ângulos internos: Si = (n - 2) × 180°, onde n = número de lados.',
            'Cada ângulo interno: ai = Si / n = (n - 2) × 180° / n.',
            'Exemplos: triângulo (60°), quadrado (90°), pentágono (108°), hexágono (120°).',
          ],
          formulas: [
            {
              expressao: 'Si = (n - 2) × 180°',
              descricao: 'Soma dos ângulos internos',
              variaveis: [
                { simbolo: 'n', significado: 'Número de lados' },
              ],
            },
            {
              expressao: 'ai = (n - 2) × 180° / n',
              descricao: 'Cada ângulo interno (regular)',
            },
          ],
          exemplos: [
            {
              enunciado: 'Qual a medida de cada ângulo interno de um octógono regular?',
              resolucao: [
                'n = 8 lados',
                'ai = (8 - 2) × 180° / 8',
                'ai = 6 × 180° / 8',
                'ai = 1080° / 8 = 135°',
              ],
              resposta: '135°',
            },
          ],
        },
        {
          id: 'area-figuras-planas',
          titulo: 'Área de Figuras Planas',
          icone: '⬜',
          resumo: 'Cálculo da área de quadriláteros e triângulos.',
          conteudo: [
            'Quadrado: A = l² (lado ao quadrado).',
            'Retângulo: A = b × h (base × altura).',
            'Triângulo: A = (b × h) / 2.',
            'Paralelogramo: A = b × h.',
            'Trapézio: A = (B + b) × h / 2 (soma das bases × altura / 2).',
            'Losango: A = (D × d) / 2 (produto das diagonais / 2).',
          ],
          formulas: [
            {
              expressao: 'A□ = l²',
              descricao: 'Área do quadrado',
            },
            {
              expressao: 'A▭ = b × h',
              descricao: 'Área do retângulo',
            },
            {
              expressao: 'A△ = (b × h) / 2',
              descricao: 'Área do triângulo',
            },
            {
              expressao: 'A⏢ = (B + b) × h / 2',
              descricao: 'Área do trapézio',
            },
          ],
          exemplos: [
            {
              enunciado: 'Calcule a área de um triângulo com base 10 cm e altura 6 cm.',
              resolucao: [
                'A = (b × h) / 2',
                'A = (10 × 6) / 2',
                'A = 60 / 2 = 30 cm²',
              ],
              resposta: 'A = 30 cm²',
            },
          ],
          dicaImportante: 'A altura é sempre perpendicular à base!',
        },
        {
          id: 'semelhanca-triangulos',
          titulo: 'Semelhança de Triângulos',
          icone: '🔄',
          resumo: 'Triângulos com mesma forma, mas tamanhos diferentes.',
          conteudo: [
            'Triângulos semelhantes: ângulos iguais e lados proporcionais.',
            'Razão de semelhança (k): proporção entre lados correspondentes.',
            'Casos de semelhança: AA (dois ângulos), LAL (lado-ângulo-lado proporcional), LLL (três lados proporcionais).',
            'Se k é a razão de semelhança, a razão das áreas é k².',
          ],
          formulas: [
            {
              expressao: 'a/a\' = b/b\' = c/c\' = k',
              descricao: 'Razão de semelhança',
            },
            {
              expressao: 'A₁/A₂ = k²',
              descricao: 'Razão das áreas',
            },
          ],
          exemplos: [
            {
              enunciado: 'Dois triângulos semelhantes têm lados 6 cm e 9 cm correspondentes. Se a área do menor é 24 cm², qual a área do maior?',
              resolucao: [
                'Razão de semelhança: k = 9/6 = 1,5',
                'Razão das áreas: k² = 1,5² = 2,25',
                'Área maior = 24 × 2,25 = 54 cm²',
              ],
              resposta: 'A = 54 cm²',
            },
          ],
        },
        {
          id: 'razao-grandezas',
          titulo: 'Razão entre Grandezas',
          icone: '📊',
          resumo: 'Comparação entre grandezas de espécies diferentes.',
          conteudo: [
            'Razão: quociente entre duas grandezas. Ex: velocidade = distância/tempo.',
            'Velocidade média: vm = ΔS/Δt (km/h, m/s).',
            'Densidade demográfica: hab/km².',
            'Escala de mapa: razão entre distância no mapa e distância real.',
          ],
          formulas: [
            {
              expressao: 'v = d/t',
              descricao: 'Velocidade',
            },
            {
              expressao: 'Densidade = população/área',
              descricao: 'Densidade demográfica',
            },
          ],
          exemplos: [
            {
              enunciado: 'Uma cidade tem 500.000 habitantes em 250 km². Qual a densidade demográfica?',
              resolucao: [
                'Densidade = população / área',
                'D = 500.000 / 250',
                'D = 2.000 hab/km²',
              ],
              resposta: '2.000 habitantes por km²',
            },
          ],
        },
        {
          id: 'regra-de-tres',
          titulo: 'Regra de Três',
          icone: '🔢',
          resumo: 'Método para resolver problemas de proporcionalidade.',
          conteudo: [
            'Regra de três simples: relaciona duas grandezas.',
            'Diretamente proporcionais: multiplica cruzado mantendo posição.',
            'Inversamente proporcionais: multiplica cruzado invertendo uma.',
            'Regra de três composta: envolve três ou mais grandezas.',
          ],
          formulas: [
            {
              expressao: 'a/b = c/x → x = bc/a',
              descricao: 'Regra de três direta',
            },
          ],
          exemplos: [
            {
              enunciado: 'Se 3 kg de arroz custam R$ 15, quanto custam 7 kg?',
              resolucao: [
                'Grandezas diretamente proporcionais',
                '3 kg → R$ 15',
                '7 kg → x',
                'x = (7 × 15) / 3 = 105 / 3 = 35',
              ],
              resposta: 'R$ 35,00',
            },
          ],
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 3ª SÉRIE - MATEMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

export const MATEMATICA_3_SERIE: ConteudoSerie = {
  serie: 3,
  componente: 'fisica',
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Resolver e elaborar problemas que envolvem porcentagens e estatística básica.',
      codigoHabilidade: 'EM13MAT314',
      topicos: [
        {
          id: 'porcentagem',
          titulo: 'Porcentagem',
          icone: '💯',
          resumo: 'Razão centesimal - fração de denominador 100.',
          conteudo: [
            'Porcentagem: parte de um todo dividido em 100 partes iguais.',
            'p% de V = (p/100) × V ou p% × V.',
            'Acréscimo: V_final = V × (1 + p/100).',
            'Desconto: V_final = V × (1 - p/100).',
            'Percentuais sucessivos: multiplica os fatores.',
          ],
          formulas: [
            {
              expressao: 'p% de V = (p/100) × V',
              descricao: 'Cálculo de porcentagem',
            },
            {
              expressao: 'V_final = V × (1 + i)ⁿ',
              descricao: 'Acréscimos/descontos sucessivos',
            },
          ],
          exemplos: [
            {
              enunciado: 'Um produto de R$ 200 teve desconto de 15%. Qual o preço final?',
              resolucao: [
                'Desconto = 200 × 0,15 = R$ 30',
                'Ou: Preço final = 200 × (1 - 0,15)',
                'Preço final = 200 × 0,85 = R$ 170',
              ],
              resposta: 'R$ 170,00',
            },
            {
              enunciado: 'Um preço aumentou 20% e depois teve desconto de 20%. Voltou ao original?',
              resolucao: [
                'Fator de aumento: 1,20',
                'Fator de desconto: 0,80',
                'Fator final: 1,20 × 0,80 = 0,96',
                'Resultado: 96% do original (4% a menos!)',
              ],
              resposta: 'Não. Ficou 4% menor que o original.',
            },
          ],
          dicaImportante: 'Aumentar 20% e depois diminuir 20% NÃO volta ao original! São bases diferentes.',
        },
        {
          id: 'variaveis-estatisticas',
          titulo: 'Variáveis Estatísticas',
          icone: '📋',
          resumo: 'Classificação dos tipos de dados estatísticos.',
          conteudo: [
            'Variável qualitativa: expressa qualidade/categoria. Ex: cor, gênero, profissão.',
            'Variável quantitativa: expressa quantidade numérica.',
            'Quantitativa discreta: valores isolados, geralmente contagem. Ex: número de filhos.',
            'Quantitativa contínua: qualquer valor em um intervalo. Ex: altura, peso.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Classifique: a) Número de irmãos. b) Peso. c) Estado civil.',
              resolucao: [
                'a) Número de irmãos: quantitativa discreta (0, 1, 2, 3...)',
                'b) Peso: quantitativa contínua (pode ser 70,5 kg)',
                'c) Estado civil: qualitativa nominal (solteiro, casado...)',
              ],
              resposta: 'a) Quant. discreta. b) Quant. contínua. c) Qualitativa.',
            },
          ],
        },
        {
          id: 'graficos-estatisticos',
          titulo: 'Gráficos Estatísticos',
          icone: '📊',
          resumo: 'Representação visual de dados.',
          conteudo: [
            'Elementos essenciais: título, eixos rotulados, legenda, fonte dos dados.',
            'Gráfico de barras: comparar categorias.',
            'Gráfico de linhas: mostrar evolução temporal.',
            'Gráfico de setores (pizza): mostrar proporções do todo.',
            'Histograma: distribuição de frequências (dados agrupados em classes).',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Qual tipo de gráfico é mais adequado para mostrar a evolução do PIB ao longo de 10 anos?',
              resolucao: [
                'Queremos mostrar evolução temporal',
                'Gráfico de linhas é o mais adequado',
                'Permite visualizar tendências e variações',
              ],
              resposta: 'Gráfico de linhas.',
            },
          ],
        },
        {
          id: 'medidas-tendencia-central',
          titulo: 'Medidas de Tendência Central',
          icone: '🎯',
          resumo: 'Média, moda e mediana - valores que representam o conjunto.',
          conteudo: [
            'Média aritmética: soma de todos os valores dividida pela quantidade.',
            'Média ponderada: considera pesos diferentes para cada valor.',
            'Moda: valor que mais se repete. Pode não existir ou haver várias.',
            'Mediana: valor central quando os dados estão ordenados.',
          ],
          formulas: [
            {
              expressao: 'x̄ = (x₁ + x₂ + ... + xₙ) / n',
              descricao: 'Média aritmética',
            },
            {
              expressao: 'x̄ₚ = (p₁x₁ + p₂x₂ + ...) / (p₁ + p₂ + ...)',
              descricao: 'Média ponderada',
            },
          ],
          exemplos: [
            {
              enunciado: 'Notas: 7, 8, 5, 9, 8, 8, 6. Calcule média, moda e mediana.',
              resolucao: [
                'Média = (7+8+5+9+8+8+6)/7 = 51/7 ≈ 7,3',
                'Moda = 8 (aparece 3 vezes)',
                'Ordenando: 5, 6, 7, 8, 8, 8, 9',
                'Mediana = 8 (valor central, posição 4)',
              ],
              resposta: 'Média ≈ 7,3; Moda = 8; Mediana = 8',
            },
          ],
          dicaImportante: 'A média é afetada por valores extremos. A mediana é mais robusta para dados com outliers.',
        },
        {
          id: 'medidas-dispersao',
          titulo: 'Medidas de Dispersão',
          icone: '↔️',
          resumo: 'Amplitude, variância e desvio-padrão - como os dados estão espalhados.',
          conteudo: [
            'Amplitude: diferença entre maior e menor valor. Simples, mas limitada.',
            'Variância (s²): média dos quadrados dos desvios em relação à média.',
            'Desvio-padrão (s): raiz quadrada da variância. Mesma unidade dos dados.',
            'Quanto maior o desvio-padrão, mais dispersos estão os dados.',
          ],
          formulas: [
            {
              expressao: 'Amplitude = máx - mín',
              descricao: 'Amplitude',
            },
            {
              expressao: 's² = Σ(xᵢ - x̄)² / n',
              descricao: 'Variância',
            },
            {
              expressao: 's = √s²',
              descricao: 'Desvio-padrão',
            },
          ],
          exemplos: [
            {
              enunciado: 'Dados: 4, 6, 8. Calcule a variância e o desvio-padrão.',
              resolucao: [
                'Média = (4+6+8)/3 = 6',
                'Desvios: (4-6)=-2, (6-6)=0, (8-6)=2',
                'Quadrados: 4, 0, 4',
                'Variância = (4+0+4)/3 = 8/3 ≈ 2,67',
                'Desvio-padrão = √2,67 ≈ 1,63',
              ],
              resposta: 'Variância ≈ 2,67; Desvio-padrão ≈ 1,63',
            },
          ],
        },
        {
          id: 'amostragem',
          titulo: 'Técnicas de Amostragem',
          icone: '🎲',
          resumo: 'Formas de selecionar uma amostra representativa.',
          conteudo: [
            'Amostra: parte da população selecionada para estudo.',
            'Amostragem aleatória simples: todos têm mesma chance de ser escolhidos.',
            'Amostragem sistemática: seleciona de k em k elementos.',
            'Amostragem estratificada: divide em grupos (estratos) e sorteia de cada um.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Uma escola quer pesquisar 50 alunos de um total de 1000. Qual técnica usar se quiser representar todas as séries proporcionalmente?',
              resolucao: [
                'Queremos representação proporcional por série',
                'Usamos amostragem ESTRATIFICADA',
                'Dividimos por série e selecionamos de cada',
                'Ex: se 200 são da 1ª série, selecionamos 200/1000 × 50 = 10',
              ],
              resposta: 'Amostragem estratificada.',
            },
          ],
          dicaImportante: 'Uma amostra bem selecionada permite conclusões sobre toda a população!',
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO GERAL
// ═══════════════════════════════════════════════════════════════════════════

export const MATEMATICA_CONTEUDOS: Record<number, ConteudoSerie> = {
  1: MATEMATICA_1_SERIE,
  2: MATEMATICA_2_SERIE,
  3: MATEMATICA_3_SERIE,
}

export function getTopicosTeoriaMatematica(serie: number, bimestre: number = 1): Topico[] {
  const conteudo = MATEMATICA_CONTEUDOS[serie]
  if (!conteudo) return []

  const bim = conteudo.bimestres.find(b => b.bimestre === bimestre)
  return bim?.topicos || []
}

export function getTopicoMatematicaById(serie: number, topicoId: string, bimestre: number = 1): Topico | null {
  const topicos = getTopicosTeoriaMatematica(serie, bimestre)
  return topicos.find(t => t.id === topicoId) || null
}
