/**
 * Script de Importação - Estudantes de Física
 * Colégio Estadual Cora Coralina
 *
 * Total: 279 alunos
 * Turmas: 1A, 1B, 2A, 2B, 3A, 3B, 3C
 * Componente: Física
 *
 * Executar com: npx ts-node scripts/importar-fisica-cora-coralina.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'

// Configuração Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE não configuradas')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Senha padrão
const SENHA_PADRAO = '@estudante'
const COLEGIO = 'Cora Coralina'

// Função para normalizar texto (remover acentos)
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Função para gerar email do estudante
function gerarEmail(nome: string, turma: string): string {
  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e']
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(p => !preposicoes.includes(p.toLowerCase()))
    .map(p => normalizarTexto(p))
    .filter(p => p.length > 0)

  const primeiroNome = partes[0] || ''
  const ultimoNome = partes.length > 1 ? partes[partes.length - 1] : ''
  const nomeEmail = ultimoNome ? `${primeiroNome}.${ultimoNome}` : primeiroNome

  return `${nomeEmail}@${turma.toLowerCase()}`
}

// Função para extrair ano e nível da turma
function extrairInfoTurma(turma: string): { ano: number; nivel: string; serie: string } {
  const match = turma.match(/^(\d)([A-C])$/i)
  if (!match) throw new Error(`Turma inválida: ${turma}`)

  return {
    ano: parseInt(match[1]),
    nivel: 'EM',
    serie: `${match[1]}EM`
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DADOS DOS ESTUDANTES
// ═══════════════════════════════════════════════════════════════════════════

interface Estudante {
  nome: string
  turma: string
}

// Turma 1A - 1ª Série (44 alunos)
const turma1A: Estudante[] = [
  { nome: "Alexandre de Freitas Souto", turma: "1A" },
  { nome: "Aline Alves Correia Rodrigues", turma: "1A" },
  { nome: "Ana Ester da Silva Pedroira", turma: "1A" },
  { nome: "Ariel de Nazaré Monteiro", turma: "1A" },
  { nome: "Arthur Lemes Silva", turma: "1A" },
  { nome: "Arthur Rodrigues Cardoso dos Santos", turma: "1A" },
  { nome: "Benjamin Kevin Ramirez dos Santos", turma: "1A" },
  { nome: "Clarisse Ribeiro de Oliveira", turma: "1A" },
  { nome: "Cristiano Barauna Santos", turma: "1A" },
  { nome: "Daniel Ribeiro de Sousa", turma: "1A" },
  { nome: "Davi Giuvana Silva Chaves", turma: "1A" },
  { nome: "Eduardo Cardoso Silva", turma: "1A" },
  { nome: "Ellen Sousa Xavier", turma: "1A" },
  { nome: "Emilly Mikaelle Sales Nascimento", turma: "1A" },
  { nome: "Enzo Kaiuqe Ferreira Lima Sousa", turma: "1A" },
  { nome: "Francisco Rayan Oliveira de Araújo", turma: "1A" },
  { nome: "Gabriel Ortiz Ribeiro de Castro", turma: "1A" },
  { nome: "Gustavo Gabriel Lima Rocha", turma: "1A" },
  { nome: "Heitor Dias de Oliveira", turma: "1A" },
  { nome: "Isabela Lira Castro", turma: "1A" },
  { nome: "Ítalo André Chaves Gomes", turma: "1A" },
  { nome: "João Paulo Pereira de Carvalho", turma: "1A" },
  { nome: "Kailane Pereira Leite", turma: "1A" },
  { nome: "Kauã Mariane Rodrigues Araújo", turma: "1A" },
  { nome: "Kauã Alves Ribeiro", turma: "1A" },
  { nome: "Keny Costa Carvalho", turma: "1A" },
  { nome: "Kleber Augusto Ferreira Sena", turma: "1A" },
  { nome: "Lara Galvão Queiroz", turma: "1A" },
  { nome: "Laura Cristina do Nascimento", turma: "1A" },
  { nome: "Luan Tavares dos Anjos", turma: "1A" },
  { nome: "Lucas Lima Nascimento", turma: "1A" },
  { nome: "Maelen Ramos dos Santos", turma: "1A" },
  { nome: "Maria Gabriella Rosa Stival Silva", turma: "1A" },
  { nome: "Maria Rosa Gonçalves Travasso", turma: "1A" },
  { nome: "Nathavus Pereira Santos", turma: "1A" },
  { nome: "Matheus Araújo Mendes", turma: "1A" },
  { nome: "Miguel Santos Aragão", turma: "1A" },
  { nome: "Paulo Eduardo Máximo Lopes", turma: "1A" },
  { nome: "Pedro Henrique Rabelo da Silva", turma: "1A" },
  { nome: "Rafaela Fernandes Gonçalves", turma: "1A" },
  { nome: "Samuel Henrique Mendes da Cruz", turma: "1A" },
  { nome: "Weverson Junior Gorgonha Figueiredo", turma: "1A" },
  { nome: "Yasmim Alves dos Santos", turma: "1A" },
  { nome: "Yasmim Fernanda Torres", turma: "1A" },
]

// Turma 1B - 1ª Série (44 alunos)
const turma1B: Estudante[] = [
  { nome: "Alexandre Ferreira dos Santos Andrade", turma: "1B" },
  { nome: "Ana Carolina de Oliveira Sousa", turma: "1B" },
  { nome: "Carlos Eduardo Machado da Costa Filho", turma: "1B" },
  { nome: "Daniel Rodrigues de Olho da Silva", turma: "1B" },
  { nome: "Derick Rennan Diniz Pinto", turma: "1B" },
  { nome: "Eduardo Coutinho Silva", turma: "1B" },
  { nome: "Elizabete Silva Rodrigues", turma: "1B" },
  { nome: "Gabriel Henrique Nascimento da Silva", turma: "1B" },
  { nome: "Gabriel Sousa Amaral", turma: "1B" },
  { nome: "Gabriele Reis Gonçalves", turma: "1B" },
  { nome: "Gabriella Paraguaçu Machado Cavalcante", turma: "1B" },
  { nome: "Guilherme Carmo da Silva", turma: "1B" },
  { nome: "Guilherme Mendes Vieira Filho", turma: "1B" },
  { nome: "Hayla Rodrigues Ribeiro", turma: "1B" },
  { nome: "Isabela da Silva Aguiar", turma: "1B" },
  { nome: "Istefani da Silva dos Santos", turma: "1B" },
  { nome: "Ítalo de Castro Silva Oliveira", turma: "1B" },
  { nome: "Izabela Lima dos Santos", turma: "1B" },
  { nome: "Jean Vinicius Araújo de Sá", turma: "1B" },
  { nome: "João Gabriel Nogueira", turma: "1B" },
  { nome: "João Pedro Alves da Silva", turma: "1B" },
  { nome: "João Pedro Viana Santos", turma: "1B" },
  { nome: "João Victor Evangelista de Almeida", turma: "1B" },
  { nome: "Kauan Victor Garcia Sales", turma: "1B" },
  { nome: "Liara Rosa Rodrigues da Silva", turma: "1B" },
  { nome: "Liara Cruvinel da Silva", turma: "1B" },
  { nome: "Luis Fernando Santos Ferreira", turma: "1B" },
  { nome: "Luis Fernando Santos Dias Nogueira", turma: "1B" },
  { nome: "Luiz Otávio Oliveira de Sousa", turma: "1B" },
  { nome: "Manuella Moreira da Silva Barbosa", turma: "1B" },
  { nome: "Maria Eduarda da Silva", turma: "1B" },
  { nome: "Matheus de Macedo Carvalho", turma: "1B" },
  { nome: "Matheus Guimarães de Medeiros Lima", turma: "1B" },
  { nome: "Miguel Caleb Souza Silva", turma: "1B" },
  { nome: "Mikael da Costa Corrêa", turma: "1B" },
  { nome: "Nadielly Faustino da Silva", turma: "1B" },
  { nome: "Pedro Soares Seixas", turma: "1B" },
  { nome: "Pietro Jefferson Diniz Pereira", turma: "1B" },
  { nome: "Victor Hugo de Souza Mendanha", turma: "1B" },
  { nome: "Vinicius Inácio Silva", turma: "1B" },
  { nome: "Vitor Gabriel Santos Costa", turma: "1B" },
  { nome: "Yasmin Silva Matos", turma: "1B" },
  { nome: "Yasmin Alves dos Santos", turma: "1B" },
  { nome: "Yuri Gabriel da Silva Cruz", turma: "1B" },
]

// Turma 2A - 2ª Série (44 alunos)
const turma2A: Estudante[] = [
  { nome: "Adalto Victor Oliveira Barros", turma: "2A" },
  { nome: "Amanda Alves de Oliveira", turma: "2A" },
  { nome: "Ana Clara Ferreira dos Santos Andrade", turma: "2A" },
  { nome: "Ana Luiza Lima Souza", turma: "2A" },
  { nome: "Antonio Rai Souza da Silva", turma: "2A" },
  { nome: "Arthur Ferreira Brito", turma: "2A" },
  { nome: "Cristiane de Sousa Nascimento", turma: "2A" },
  { nome: "Daize Wanessa Maciel da Cruz", turma: "2A" },
  { nome: "Davi Augusto de Andrade Silva", turma: "2A" },
  { nome: "Deyvid Lucas Lopes Pereira", turma: "2A" },
  { nome: "Giovana das Neves Santos", turma: "2A" },
  { nome: "Guilherme Alves Guimarães Araujo Braga", turma: "2A" },
  { nome: "Gustavo Felipe Costa de Oliveira", turma: "2A" },
  { nome: "Hemanuele Narciso Braúna", turma: "2A" },
  { nome: "Hiarley Davi Tavares dos Santos", turma: "2A" },
  { nome: "Isaac Martins da Cunha", turma: "2A" },
  { nome: "Isaque Chaves Gomes", turma: "2A" },
  { nome: "Jhevilly Maria da Conceição Souza", turma: "2A" },
  { nome: "João Pedro Loterio Rodrigues", turma: "2A" },
  { nome: "José Alfredo da Silva Peres", turma: "2A" },
  { nome: "Karla Mikaelly Chaves Farias", turma: "2A" },
  { nome: "Kayon Henrique Rodrigues da Silva", turma: "2A" },
  { nome: "Kézia Costa Santana", turma: "2A" },
  { nome: "Kristyane Ferreira Sandes", turma: "2A" },
  { nome: "Lucas da Silva Borges", turma: "2A" },
  { nome: "Ludmila Marques Nascimento", turma: "2A" },
  { nome: "Luiz Fernando Mendes da Cruz", turma: "2A" },
  { nome: "Maria Clara Benevides Vasco Barbosa", turma: "2A" },
  { nome: "Maria Fernanda de Souza Lobo", turma: "2A" },
  { nome: "Matheus Rikelme Araujo Alves", turma: "2A" },
  { nome: "Mayk Pereira Cezar", turma: "2A" },
  { nome: "Miqueias da Silva Nascimento", turma: "2A" },
  { nome: "Paulo Victor Matos Serra", turma: "2A" },
  { nome: "Pietro Ferreira dos Santos", turma: "2A" },
  { nome: "Ronald Araujo Oliveira", turma: "2A" },
  { nome: "Samuel Rodrigues de Oliveira", turma: "2A" },
  { nome: "Samuel Taylor da Silva", turma: "2A" },
  { nome: "Saul Isaac Batista Monteiro", turma: "2A" },
  { nome: "Tainá Ferreira de Morais", turma: "2A" },
  { nome: "Túlio Barbosa de Melo Mota", turma: "2A" },
  { nome: "Vanessa da Silva Ferreira", turma: "2A" },
  { nome: "Victor Emanuel Neves Silva", turma: "2A" },
  { nome: "Vitor Gabriel Mendes Teles Lima", turma: "2A" },
  { nome: "Ysla Manuella da Silva Lopes", turma: "2A" },
]

// Turma 2B - 2ª Série (44 alunos)
const turma2B: Estudante[] = [
  { nome: "Ana Julia Rodrigues Alves", turma: "2B" },
  { nome: "Antonio Rian Castro Feitosa", turma: "2B" },
  { nome: "Bruno Vitoriano Marinho", turma: "2B" },
  { nome: "Carla Geovanna Paiva Santana", turma: "2B" },
  { nome: "Chayra Corrêa da Silva", turma: "2B" },
  { nome: "Daniel Souza Santos", turma: "2B" },
  { nome: "Darlan Brito Ribeiro", turma: "2B" },
  { nome: "Davy Gustavo Pereira de Oliveira", turma: "2B" },
  { nome: "Dionne Cleiton Correia Muniz Júnior", turma: "2B" },
  { nome: "Edclecio Sousa dos Santos", turma: "2B" },
  { nome: "Eloisa Martins da Silva", turma: "2B" },
  { nome: "Emilly Guimaraes Lobo", turma: "2B" },
  { nome: "Eric Gabriel Ferreira Sousa", turma: "2B" },
  { nome: "Gabriela Ferreira Rezende", turma: "2B" },
  { nome: "Geissykelle Máximo Rodrigues", turma: "2B" },
  { nome: "Georgi Felipe Silva de Almeida", turma: "2B" },
  { nome: "Heloísa Almeida Rocha", turma: "2B" },
  { nome: "Henrique de Jesus Sousa", turma: "2B" },
  { nome: "Henrique Gabriel Carvalho Alves Queiroz", turma: "2B" },
  { nome: "Isabella Matinada Santos de Jesus", turma: "2B" },
  { nome: "Izadora Santos Dias Nogueira", turma: "2B" },
  { nome: "Joaquim Pedro Ferreira Neto", turma: "2B" },
  { nome: "Kaiky Gabriel Sousa Araujo", turma: "2B" },
  { nome: "Kauan Christian Montel Lopes de Sousa", turma: "2B" },
  { nome: "Laura Ribeiro Simplicio", turma: "2B" },
  { nome: "Laura Vitória Alves Carvalho", turma: "2B" },
  { nome: "Lucas Bezerra de Queiroz", turma: "2B" },
  { nome: "Michelly Araujo Silva", turma: "2B" },
  { nome: "Mikaelly Sena Souza", turma: "2B" },
  { nome: "Monique Salvador Santos", turma: "2B" },
  { nome: "Narrayra Pereira Nunes", turma: "2B" },
  { nome: "Paula do Carmo Martins", turma: "2B" },
  { nome: "Paulo Victor Pinheiro Silva Brito", turma: "2B" },
  { nome: "Pedro da Veiga Jardim Sarques", turma: "2B" },
  { nome: "Pedro Henrique Braz Bispo", turma: "2B" },
  { nome: "Pedro Sobrinho Ribeiro Gomes", turma: "2B" },
  { nome: "Raislan Dias Rodrigues", turma: "2B" },
  { nome: "Raphá de Campos Baldan Ferreira", turma: "2B" },
  { nome: "Roberto Scaglia Netto", turma: "2B" },
  { nome: "Samara Laiz Ferreira de Sousa", turma: "2B" },
  { nome: "Samuel Julião de Sousa", turma: "2B" },
  { nome: "Samuell de Souza Cardoso", turma: "2B" },
  { nome: "Sara Eduarda da Silva Vieira Rosa", turma: "2B" },
  { nome: "Sávio Soares Oliveira", turma: "2B" },
]

// Turma 3A - 3ª Série (37 alunos)
const turma3A: Estudante[] = [
  { nome: "Adrielly Alves Correia Rodrigues", turma: "3A" },
  { nome: "Ana Carolina Ferreira Balduíno", turma: "3A" },
  { nome: "Ana Clara Garcia da Silva", turma: "3A" },
  { nome: "Antoniel Breno Ferreira de Souza", turma: "3A" },
  { nome: "Arleyson Andrade Silva", turma: "3A" },
  { nome: "Eduardo Cabral Santos", turma: "3A" },
  { nome: "Clarice Baraúna Santos", turma: "3A" },
  { nome: "Emanuely dos Santos Nascimento", turma: "3A" },
  { nome: "Emyle Ayala Mendonça Batista", turma: "3A" },
  { nome: "Enzo Francisco Neves", turma: "3A" },
  { nome: "Gabriel Henrique Montel Magalhães", turma: "3A" },
  { nome: "Gabriela Rodrigues Rocha", turma: "3A" },
  { nome: "Gabriely Vitória dos Santos Ribeiro", turma: "3A" },
  { nome: "Helane dos Santos Sousa", turma: "3A" },
  { nome: "Helen Maria Brito Sousa", turma: "3A" },
  { nome: "Iagon Silva", turma: "3A" },
  { nome: "Ingredy Cristina Rodrigues Pereira", turma: "3A" },
  { nome: "Isadora Marques de Moura", turma: "3A" },
  { nome: "Islaete da Conceição de Oliveira Dias", turma: "3A" },
  { nome: "João Vitor Paiva Camargo", turma: "3A" },
  { nome: "Klerys da Silva Ferreira", turma: "3A" },
  { nome: "Ludmilla Garcia da Silva Ferreira", turma: "3A" },
  { nome: "Maria Eduarda Souza Siqueira", turma: "3A" },
  { nome: "Mayck Vinicius Custódio Firmo", turma: "3A" },
  { nome: "Melissa Nunes da Silva", turma: "3A" },
  { nome: "Paulo Vitor Pimenta Rodrigues", turma: "3A" },
  { nome: "Radja Hilary dos Santos Carvalho", turma: "3A" },
  { nome: "Raíla Alves de Sousa", turma: "3A" },
  { nome: "Sthefany de Carvalho Fonseca", turma: "3A" },
  { nome: "Tálita Santos de Sousa", turma: "3A" },
  { nome: "Tiago Mendes de Oliveira", turma: "3A" },
  { nome: "Vitor Hugo Faustino dos Reis", turma: "3A" },
  { nome: "Vitor Tharlles Barbosa da Silva", turma: "3A" },
  { nome: "Walisson Richard Rosa Silva", turma: "3A" },
  { nome: "Washington Luís Gomes Júnior", turma: "3A" },
  { nome: "Widson Henrique de Sousa Vieira", turma: "3A" },
  { nome: "Yara Camilly da Silva Feitosa", turma: "3A" },
]

// Turma 3B - 3ª Série (37 alunos)
const turma3B: Estudante[] = [
  { nome: "Ahudiel Daniel da Silva Plácido", turma: "3B" },
  { nome: "Aliciane Correia da Silva Avila", turma: "3B" },
  { nome: "Ana Júlia Rodrigues de Avila", turma: "3B" },
  { nome: "Ana Luíza Lopes da Silva", turma: "3B" },
  { nome: "Brenno Jonatha Frota Souza Santana", turma: "3B" },
  { nome: "Cauã Souza Querino dos Santos", turma: "3B" },
  { nome: "Daniel Costa Batista", turma: "3B" },
  { nome: "Daniel da Silva Aguiar", turma: "3B" },
  { nome: "Dionatha Gabriella de Sousa Ribeiro", turma: "3B" },
  { nome: "Emilly Santos de Oliveira", turma: "3B" },
  { nome: "Erick Antunes Duarte", turma: "3B" },
  { nome: "Fernanda Lopes de Lima", turma: "3B" },
  { nome: "Frederico Soares Colaço", turma: "3B" },
  { nome: "Gustavo Soares de Almeida", turma: "3B" },
  { nome: "João Pedro Rocha Jordão Oliveira", turma: "3B" },
  { nome: "José Henrique Leme Barbosa", turma: "3B" },
  { nome: "Kael Christian Dias Lopes", turma: "3B" },
  { nome: "Lara Vitória Carneiro Ornelas", turma: "3B" },
  { nome: "Laura Kellys Alves de Souza", turma: "3B" },
  { nome: "Luiz Henrique Souza Santos", turma: "3B" },
  { nome: "Luiz Miguel Martins do Amaral Cruz", turma: "3B" },
  { nome: "Micael Wesley de Carvalho Lima", turma: "3B" },
  { nome: "Murilo Tibúrcio Vieira", turma: "3B" },
  { nome: "Paulo Henrique Araújo Barbosa", turma: "3B" },
  { nome: "Paulo Henrique Rodrigues dos Santos", turma: "3B" },
  { nome: "Pietro Augusto Vital Farias", turma: "3B" },
  { nome: "Reinan Gomes Paiva", turma: "3B" },
  { nome: "Ricardo Gabriel Magalhães Pardim", turma: "3B" },
  { nome: "Riquelme Faria da Silva", turma: "3B" },
  { nome: "Samuel Henrique Santos", turma: "3B" },
  { nome: "Talita Alves Vieira", turma: "3B" },
  { nome: "Terezinha Vittória Araújo da Silva", turma: "3B" },
  { nome: "Thomaz Dhavith Meirjan Peres", turma: "3B" },
  { nome: "Yasmin Moraes Marques", turma: "3B" },
  { nome: "Yohara Hendelly Santos da Silva", turma: "3B" },
  { nome: "Zahara Farias Gomes", turma: "3B" },
  { nome: "Pedro Alexandre Campos da Cruz", turma: "3B" },
]

// Turma 3C - 3ª Série (29 alunos)
const turma3C: Estudante[] = [
  { nome: "Ana Beatriz Rocha Silva", turma: "3C" },
  { nome: "Ana Carolina Monteiro Chaves", turma: "3C" },
  { nome: "Ana Flávia Gonçalves da Cruz", turma: "3C" },
  { nome: "Ana Vitória Abreu Martins", turma: "3C" },
  { nome: "Andrielly Santos Rodrigues", turma: "3C" },
  { nome: "Anna Julia Alves Arantes", turma: "3C" },
  { nome: "Eduardo da Silva Cabral", turma: "3C" },
  { nome: "Ezequiel da Silva Italiano", turma: "3C" },
  { nome: "Gabrielly Oliveira de Sousa", turma: "3C" },
  { nome: "Grazielly Nunes de Jesus", turma: "3C" },
  { nome: "Guttemberg Alencar de Castro", turma: "3C" },
  { nome: "Ianna Valeska Mendes Diniz", turma: "3C" },
  { nome: "Isabela Costa Silva", turma: "3C" },
  { nome: "Isabella Ferreira Machado", turma: "3C" },
  { nome: "João Fellipe Pontes Neves Barbosa", turma: "3C" },
  { nome: "João Pedro de Sousa Soares", turma: "3C" },
  { nome: "Juliani Alves Ferreira", turma: "3C" },
  { nome: "Kauan Souza Santos", turma: "3C" },
  { nome: "Kleberson Pereira Nunes", turma: "3C" },
  { nome: "Luis Fernando de Souza Pires", turma: "3C" },
  { nome: "Luiz Fernando Halley Müller", turma: "3C" },
  { nome: "Mariana Harzer Gomes Quintas", turma: "3C" },
  { nome: "Miguel Lemos da Silva", turma: "3C" },
  { nome: "Rafael de Oliveira Vieira", turma: "3C" },
  { nome: "Renilton Martins Lima da Costa", turma: "3C" },
  { nome: "Riquelme Vitor Silva Nóbrega", turma: "3C" },
  { nome: "Ryan Matheus Oliveira Viana", turma: "3C" },
  { nome: "Victor Juscelino Leite Lima", turma: "3C" },
  { nome: "Yan Gustavo Nunes da Silva", turma: "3C" },
]

// Consolidar todos os estudantes
const TODOS_ESTUDANTES: Estudante[] = [
  ...turma1A,
  ...turma1B,
  ...turma2A,
  ...turma2B,
  ...turma3A,
  ...turma3B,
  ...turma3C,
]

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface ResultadoCadastro {
  nome: string
  turma: string
  email: string
  status: 'novo' | 'existente' | 'erro'
  erro?: string
}

async function importarEstudantes(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  IMPORTAÇÃO DE ESTUDANTES - FÍSICA')
  console.log('  Colégio Estadual Cora Coralina')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`📊 Total de estudantes: ${TODOS_ESTUDANTES.length}`)
  console.log(`🔐 Senha padrão: ${SENHA_PADRAO}`)
  console.log(`🏫 Colégio: ${COLEGIO}`)
  console.log('')

  // Gerar hash da senha padrão
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)

  const resultados: ResultadoCadastro[] = []
  let novos = 0
  let existentes = 0
  let erros = 0

  // Verificar conexão com Supabase
  console.log('🔄 Verificando conexão com Supabase...')
  const { data: testData, error: testError } = await supabase
    .from('usuarios')
    .select('count')
    .limit(1)

  if (testError) {
    console.error('❌ Erro ao conectar com Supabase:', testError.message)
    process.exit(1)
  }
  console.log('✅ Conexão estabelecida!')
  console.log('')

  // Processar cada estudante
  for (const estudante of TODOS_ESTUDANTES) {
    const email = gerarEmail(estudante.nome, estudante.turma)
    const info = extrairInfoTurma(estudante.turma)

    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('usuarios')
        .select('id, componentes')
        .eq('email', email)
        .single()

      if (existente) {
        // Verificar se já tem física
        const temFisica = existente.componentes?.includes('fisica')

        if (temFisica) {
          existentes++
          resultados.push({
            nome: estudante.nome,
            turma: estudante.turma,
            email,
            status: 'existente'
          })
        } else {
          // Adicionar física aos componentes
          const novosComponentes = [...(existente.componentes || []), 'fisica']
          await supabase
            .from('usuarios')
            .update({ componentes: novosComponentes })
            .eq('id', existente.id)

          novos++
          resultados.push({
            nome: estudante.nome,
            turma: estudante.turma,
            email,
            status: 'novo'
          })
        }
      } else {
        // Criar novo usuário
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            email,
            senha_hash: senhaHash,
            nome: estudante.nome,
            turma: estudante.turma,
            colegio: COLEGIO,
            ano: info.ano,
            nivel: info.nivel,
            componentes: ['fisica'],
            tipo: 'estudante',
            ativo: true,
            senha_alterada: false
          })

        if (insertError) {
          throw insertError
        }

        novos++
        resultados.push({
          nome: estudante.nome,
          turma: estudante.turma,
          email,
          status: 'novo'
        })
      }
    } catch (error: unknown) {
      erros++
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      resultados.push({
        nome: estudante.nome,
        turma: estudante.turma,
        email,
        status: 'erro',
        erro: errorMessage
      })
    }
  }

  // Exibir resultados
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  RESULTADO DA IMPORTAÇÃO')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`✅ Novos cadastrados: ${novos}`)
  console.log(`⏭️  Já existentes: ${existentes}`)
  console.log(`❌ Erros: ${erros}`)
  console.log('')

  // Exibir credenciais por turma
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  CREDENCIAIS POR TURMA')
  console.log('═══════════════════════════════════════════════════════════════')

  const turmas = ['1A', '1B', '2A', '2B', '3A', '3B', '3C']
  for (const turma of turmas) {
    const alunosTurma = resultados.filter(r => r.turma === turma)
    console.log('')
    console.log(`📚 TURMA ${turma} (${alunosTurma.length} alunos)`)
    console.log('─────────────────────────────────────────────────────────────')

    for (const aluno of alunosTurma) {
      const statusIcon = aluno.status === 'novo' ? '✅' :
                        aluno.status === 'existente' ? '⏭️' : '❌'
      console.log(`${statusIcon} ${aluno.nome}`)
      console.log(`   Login: ${aluno.email}`)
      if (aluno.status === 'erro') {
        console.log(`   Erro: ${aluno.erro}`)
      }
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  IMPORTAÇÃO CONCLUÍDA!')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`🔐 Senha padrão para todos: ${SENHA_PADRAO}`)
  console.log('📝 Os estudantes devem trocar a senha no primeiro acesso.')
  console.log('')
}

// Executar
importarEstudantes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
