#!/usr/bin/env node
/**
 * Script para cadastrar 279 estudantes de Fisica - Cora Coralina
 *
 * COMO USAR:
 * 1. Instale: npm install @supabase/supabase-js bcryptjs
 * 2. Execute: SUPABASE_URL=sua_url SUPABASE_KEY=sua_service_key node scripts/cadastrar-fisica.js
 *
 * IMPORTANTE: Use a SERVICE_ROLE_KEY (chave de servico), nao a anon key
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Pegar credenciais das variaveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('Credenciais nao encontradas!')
  console.log('')
  console.log('Execute assim:')
  console.log('SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=eyJ... node scripts/cadastrar-fisica.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Senha padrao para todos os estudantes
const SENHA_PADRAO = '@estudante'

// Todos os 279 estudantes
const estudantes = [
  // TURMA 1A (44)
  { nome: 'Alexandre de Freitas Souto', email: 'alexandre.souto@1a', turma: '1A', ano: 1 },
  { nome: 'Aline Alves Correia Rodrigues', email: 'aline.rodrigues@1a', turma: '1A', ano: 1 },
  { nome: 'Ana Ester da Silva Pedroira', email: 'ana.pedroira@1a', turma: '1A', ano: 1 },
  { nome: 'Ariel de Nazare Monteiro', email: 'ariel.monteiro@1a', turma: '1A', ano: 1 },
  { nome: 'Arthur Lemes Silva', email: 'arthur.silva@1a', turma: '1A', ano: 1 },
  { nome: 'Arthur Rodrigues Cardoso dos Santos', email: 'arthur.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Benjamin Kevin Ramirez dos Santos', email: 'benjamin.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Clarisse Ribeiro de Oliveira', email: 'clarisse.oliveira@1a', turma: '1A', ano: 1 },
  { nome: 'Cristiano Barauna Santos', email: 'cristiano.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Daniel Ribeiro de Sousa', email: 'daniel.sousa@1a', turma: '1A', ano: 1 },
  { nome: 'Davi Giuvana Silva Chaves', email: 'davi.chaves@1a', turma: '1A', ano: 1 },
  { nome: 'Eduardo Cardoso Silva', email: 'eduardo.silva@1a', turma: '1A', ano: 1 },
  { nome: 'Ellen Sousa Xavier', email: 'ellen.xavier@1a', turma: '1A', ano: 1 },
  { nome: 'Emilly Mikaelle Sales Nascimento', email: 'emilly.nascimento@1a', turma: '1A', ano: 1 },
  { nome: 'Enzo Kaiuqe Ferreira Lima Sousa', email: 'enzo.sousa@1a', turma: '1A', ano: 1 },
  { nome: 'Francisco Rayan Oliveira de Araujo', email: 'francisco.araujo@1a', turma: '1A', ano: 1 },
  { nome: 'Gabriel Ortiz Ribeiro de Castro', email: 'gabriel.castro@1a', turma: '1A', ano: 1 },
  { nome: 'Gustavo Gabriel Lima Rocha', email: 'gustavo.rocha@1a', turma: '1A', ano: 1 },
  { nome: 'Heitor Dias de Oliveira', email: 'heitor.oliveira@1a', turma: '1A', ano: 1 },
  { nome: 'Isabela Lira Castro', email: 'isabela.castro@1a', turma: '1A', ano: 1 },
  { nome: 'Italo Andre Chaves Gomes', email: 'italo.gomes@1a', turma: '1A', ano: 1 },
  { nome: 'Joao Paulo Pereira de Carvalho', email: 'joao.carvalho@1a', turma: '1A', ano: 1 },
  { nome: 'Kailane Pereira Leite', email: 'kailane.leite@1a', turma: '1A', ano: 1 },
  { nome: 'Kaua Mariane Rodrigues Araujo', email: 'kaua.araujo@1a', turma: '1A', ano: 1 },
  { nome: 'Kaua Alves Ribeiro', email: 'kaua.ribeiro@1a', turma: '1A', ano: 1 },
  { nome: 'Keny Costa Carvalho', email: 'keny.carvalho@1a', turma: '1A', ano: 1 },
  { nome: 'Kleber Augusto Ferreira Sena', email: 'kleber.sena@1a', turma: '1A', ano: 1 },
  { nome: 'Lara Galvao Queiroz', email: 'lara.queiroz@1a', turma: '1A', ano: 1 },
  { nome: 'Laura Cristina do Nascimento', email: 'laura.nascimento@1a', turma: '1A', ano: 1 },
  { nome: 'Luan Tavares dos Anjos', email: 'luan.anjos@1a', turma: '1A', ano: 1 },
  { nome: 'Lucas Lima Nascimento', email: 'lucas.nascimento@1a', turma: '1A', ano: 1 },
  { nome: 'Maelen Ramos dos Santos', email: 'maelen.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Maria Gabriella Rosa Stival Silva', email: 'maria.silva@1a', turma: '1A', ano: 1 },
  { nome: 'Maria Rosa Goncalves Travasso', email: 'maria.travasso@1a', turma: '1A', ano: 1 },
  { nome: 'Nathavus Pereira Santos', email: 'nathavus.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Matheus Araujo Mendes', email: 'matheus.mendes@1a', turma: '1A', ano: 1 },
  { nome: 'Miguel Santos Aragao', email: 'miguel.aragao@1a', turma: '1A', ano: 1 },
  { nome: 'Paulo Eduardo Maximo Lopes', email: 'paulo.lopes@1a', turma: '1A', ano: 1 },
  { nome: 'Pedro Henrique Rabelo da Silva', email: 'pedro.silva@1a', turma: '1A', ano: 1 },
  { nome: 'Rafaela Fernandes Goncalves', email: 'rafaela.goncalves@1a', turma: '1A', ano: 1 },
  { nome: 'Samuel Henrique Mendes da Cruz', email: 'samuel.cruz@1a', turma: '1A', ano: 1 },
  { nome: 'Weverson Junior Gorgonha Figueiredo', email: 'weverson.figueiredo@1a', turma: '1A', ano: 1 },
  { nome: 'Yasmim Alves dos Santos', email: 'yasmim.santos@1a', turma: '1A', ano: 1 },
  { nome: 'Yasmim Fernanda Torres', email: 'yasmim.torres@1a', turma: '1A', ano: 1 },
  // TURMA 1B (44)
  { nome: 'Alexandre Ferreira dos Santos Andrade', email: 'alexandre.andrade@1b', turma: '1B', ano: 1 },
  { nome: 'Ana Carolina de Oliveira Sousa', email: 'ana.sousa@1b', turma: '1B', ano: 1 },
  { nome: 'Carlos Eduardo Machado da Costa Filho', email: 'carlos.filho@1b', turma: '1B', ano: 1 },
  { nome: 'Daniel Rodrigues de Olho da Silva', email: 'daniel.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Derick Rennan Diniz Pinto', email: 'derick.pinto@1b', turma: '1B', ano: 1 },
  { nome: 'Eduardo Coutinho Silva', email: 'eduardo.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Elizabete Silva Rodrigues', email: 'elizabete.rodrigues@1b', turma: '1B', ano: 1 },
  { nome: 'Gabriel Henrique Nascimento da Silva', email: 'gabriel.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Gabriel Sousa Amaral', email: 'gabriel.amaral@1b', turma: '1B', ano: 1 },
  { nome: 'Gabriele Reis Goncalves', email: 'gabriele.goncalves@1b', turma: '1B', ano: 1 },
  { nome: 'Gabriella Paraguacu Machado Cavalcante', email: 'gabriella.cavalcante@1b', turma: '1B', ano: 1 },
  { nome: 'Guilherme Carmo da Silva', email: 'guilherme.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Guilherme Mendes Vieira Filho', email: 'guilherme.filho@1b', turma: '1B', ano: 1 },
  { nome: 'Hayla Rodrigues Ribeiro', email: 'hayla.ribeiro@1b', turma: '1B', ano: 1 },
  { nome: 'Isabela da Silva Aguiar', email: 'isabela.aguiar@1b', turma: '1B', ano: 1 },
  { nome: 'Istefani da Silva dos Santos', email: 'istefani.santos@1b', turma: '1B', ano: 1 },
  { nome: 'Italo de Castro Silva Oliveira', email: 'italo.oliveira@1b', turma: '1B', ano: 1 },
  { nome: 'Izabela Lima dos Santos', email: 'izabela.santos@1b', turma: '1B', ano: 1 },
  { nome: 'Jean Vinicius Araujo de Sa', email: 'jean.sa@1b', turma: '1B', ano: 1 },
  { nome: 'Joao Gabriel Nogueira', email: 'joao.nogueira@1b', turma: '1B', ano: 1 },
  { nome: 'Joao Pedro Alves da Silva', email: 'joao.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Joao Pedro Viana Santos', email: 'joao.santos@1b', turma: '1B', ano: 1 },
  { nome: 'Joao Victor Evangelista de Almeida', email: 'joao.almeida@1b', turma: '1B', ano: 1 },
  { nome: 'Kauan Victor Garcia Sales', email: 'kauan.sales@1b', turma: '1B', ano: 1 },
  { nome: 'Liara Rosa Rodrigues da Silva', email: 'liara.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Liara Cruvinel da Silva', email: 'liara.cruvinel@1b', turma: '1B', ano: 1 },
  { nome: 'Luis Fernando Santos Ferreira', email: 'luis.ferreira@1b', turma: '1B', ano: 1 },
  { nome: 'Luis Fernando Santos Dias Nogueira', email: 'luis.nogueira@1b', turma: '1B', ano: 1 },
  { nome: 'Luiz Otavio Oliveira de Sousa', email: 'luiz.sousa@1b', turma: '1B', ano: 1 },
  { nome: 'Manuella Moreira da Silva Barbosa', email: 'manuella.barbosa@1b', turma: '1B', ano: 1 },
  { nome: 'Maria Eduarda da Silva', email: 'maria.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Matheus de Macedo Carvalho', email: 'matheus.carvalho@1b', turma: '1B', ano: 1 },
  { nome: 'Matheus Guimaraes de Medeiros Lima', email: 'matheus.lima@1b', turma: '1B', ano: 1 },
  { nome: 'Miguel Caleb Souza Silva', email: 'miguel.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Mikael da Costa Correa', email: 'mikael.correa@1b', turma: '1B', ano: 1 },
  { nome: 'Nadielly Faustino da Silva', email: 'nadielly.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Pedro Soares Seixas', email: 'pedro.seixas@1b', turma: '1B', ano: 1 },
  { nome: 'Pietro Jefferson Diniz Pereira', email: 'pietro.pereira@1b', turma: '1B', ano: 1 },
  { nome: 'Victor Hugo de Souza Mendanha', email: 'victor.mendanha@1b', turma: '1B', ano: 1 },
  { nome: 'Vinicius Inacio Silva', email: 'vinicius.silva@1b', turma: '1B', ano: 1 },
  { nome: 'Vitor Gabriel Santos Costa', email: 'vitor.costa@1b', turma: '1B', ano: 1 },
  { nome: 'Yasmin Silva Matos', email: 'yasmin.matos@1b', turma: '1B', ano: 1 },
  { nome: 'Yasmin Alves dos Santos', email: 'yasmin.santos@1b', turma: '1B', ano: 1 },
  { nome: 'Yuri Gabriel da Silva Cruz', email: 'yuri.cruz@1b', turma: '1B', ano: 1 },
  // TURMA 2A (44)
  { nome: 'Adalto Victor Oliveira Barros', email: 'adalto.barros@2a', turma: '2A', ano: 2 },
  { nome: 'Amanda Alves de Oliveira', email: 'amanda.oliveira@2a', turma: '2A', ano: 2 },
  { nome: 'Ana Clara Ferreira dos Santos Andrade', email: 'ana.andrade@2a', turma: '2A', ano: 2 },
  { nome: 'Ana Luiza Lima Souza', email: 'ana.souza@2a', turma: '2A', ano: 2 },
  { nome: 'Antonio Rai Souza da Silva', email: 'antonio.silva@2a', turma: '2A', ano: 2 },
  { nome: 'Arthur Ferreira Brito', email: 'arthur.brito@2a', turma: '2A', ano: 2 },
  { nome: 'Cristiane de Sousa Nascimento', email: 'cristiane.nascimento@2a', turma: '2A', ano: 2 },
  { nome: 'Daize Wanessa Maciel da Cruz', email: 'daize.cruz@2a', turma: '2A', ano: 2 },
  { nome: 'Davi Augusto de Andrade Silva', email: 'davi.silva@2a', turma: '2A', ano: 2 },
  { nome: 'Deyvid Lucas Lopes Pereira', email: 'deyvid.pereira@2a', turma: '2A', ano: 2 },
  { nome: 'Giovana das Neves Santos', email: 'giovana.santos@2a', turma: '2A', ano: 2 },
  { nome: 'Guilherme Alves Guimaraes Araujo Braga', email: 'guilherme.braga@2a', turma: '2A', ano: 2 },
  { nome: 'Gustavo Felipe Costa de Oliveira', email: 'gustavo.oliveira@2a', turma: '2A', ano: 2 },
  { nome: 'Hemanuele Narciso Brauna', email: 'hemanuele.brauna@2a', turma: '2A', ano: 2 },
  { nome: 'Hiarley Davi Tavares dos Santos', email: 'hiarley.santos@2a', turma: '2A', ano: 2 },
  { nome: 'Isaac Martins da Cunha', email: 'isaac.cunha@2a', turma: '2A', ano: 2 },
  { nome: 'Isaque Chaves Gomes', email: 'isaque.gomes@2a', turma: '2A', ano: 2 },
  { nome: 'Jhevilly Maria da Conceicao Souza', email: 'jhevilly.souza@2a', turma: '2A', ano: 2 },
  { nome: 'Joao Pedro Loterio Rodrigues', email: 'joao.rodrigues@2a', turma: '2A', ano: 2 },
  { nome: 'Jose Alfredo da Silva Peres', email: 'jose.peres@2a', turma: '2A', ano: 2 },
  { nome: 'Karla Mikaelly Chaves Farias', email: 'karla.farias@2a', turma: '2A', ano: 2 },
  { nome: 'Kayon Henrique Rodrigues da Silva', email: 'kayon.silva@2a', turma: '2A', ano: 2 },
  { nome: 'Kezia Costa Santana', email: 'kezia.santana@2a', turma: '2A', ano: 2 },
  { nome: 'Kristyane Ferreira Sandes', email: 'kristyane.sandes@2a', turma: '2A', ano: 2 },
  { nome: 'Lucas da Silva Borges', email: 'lucas.borges@2a', turma: '2A', ano: 2 },
  { nome: 'Ludmila Marques Nascimento', email: 'ludmila.nascimento@2a', turma: '2A', ano: 2 },
  { nome: 'Luiz Fernando Mendes da Cruz', email: 'luiz.cruz@2a', turma: '2A', ano: 2 },
  { nome: 'Maria Clara Benevides Vasco Barbosa', email: 'maria.barbosa@2a', turma: '2A', ano: 2 },
  { nome: 'Maria Fernanda de Souza Lobo', email: 'maria.lobo@2a', turma: '2A', ano: 2 },
  { nome: 'Matheus Rikelme Araujo Alves', email: 'matheus.alves@2a', turma: '2A', ano: 2 },
  { nome: 'Mayk Pereira Cezar', email: 'mayk.cezar@2a', turma: '2A', ano: 2 },
  { nome: 'Miqueias da Silva Nascimento', email: 'miqueias.nascimento@2a', turma: '2A', ano: 2 },
  { nome: 'Paulo Victor Matos Serra', email: 'paulo.serra@2a', turma: '2A', ano: 2 },
  { nome: 'Pietro Ferreira dos Santos', email: 'pietro.santos@2a', turma: '2A', ano: 2 },
  { nome: 'Ronald Araujo Oliveira', email: 'ronald.oliveira@2a', turma: '2A', ano: 2 },
  { nome: 'Samuel Rodrigues de Oliveira', email: 'samuel.oliveira@2a', turma: '2A', ano: 2 },
  { nome: 'Samuel Taylor da Silva', email: 'samuel.silva@2a', turma: '2A', ano: 2 },
  { nome: 'Saul Isaac Batista Monteiro', email: 'saul.monteiro@2a', turma: '2A', ano: 2 },
  { nome: 'Taina Ferreira de Morais', email: 'taina.morais@2a', turma: '2A', ano: 2 },
  { nome: 'Tulio Barbosa de Melo Mota', email: 'tulio.mota@2a', turma: '2A', ano: 2 },
  { nome: 'Vanessa da Silva Ferreira', email: 'vanessa.ferreira@2a', turma: '2A', ano: 2 },
  { nome: 'Victor Emanuel Neves Silva', email: 'victor.silva@2a', turma: '2A', ano: 2 },
  { nome: 'Vitor Gabriel Mendes Teles Lima', email: 'vitor.lima@2a', turma: '2A', ano: 2 },
  { nome: 'Ysla Manuella da Silva Lopes', email: 'ysla.lopes@2a', turma: '2A', ano: 2 },
  // TURMA 2B (44)
  { nome: 'Ana Julia Rodrigues Alves', email: 'ana.alves@2b', turma: '2B', ano: 2 },
  { nome: 'Antonio Rian Castro Feitosa', email: 'antonio.feitosa@2b', turma: '2B', ano: 2 },
  { nome: 'Bruno Vitoriano Marinho', email: 'bruno.marinho@2b', turma: '2B', ano: 2 },
  { nome: 'Carla Geovanna Paiva Santana', email: 'carla.santana@2b', turma: '2B', ano: 2 },
  { nome: 'Chayra Correa da Silva', email: 'chayra.silva@2b', turma: '2B', ano: 2 },
  { nome: 'Daniel Souza Santos', email: 'daniel.santos@2b', turma: '2B', ano: 2 },
  { nome: 'Darlan Brito Ribeiro', email: 'darlan.ribeiro@2b', turma: '2B', ano: 2 },
  { nome: 'Davy Gustavo Pereira de Oliveira', email: 'davy.oliveira@2b', turma: '2B', ano: 2 },
  { nome: 'Dionne Cleiton Correia Muniz Junior', email: 'dionne.junior@2b', turma: '2B', ano: 2 },
  { nome: 'Edclecio Sousa dos Santos', email: 'edclecio.santos@2b', turma: '2B', ano: 2 },
  { nome: 'Eloisa Martins da Silva', email: 'eloisa.silva@2b', turma: '2B', ano: 2 },
  { nome: 'Emilly Guimaraes Lobo', email: 'emilly.lobo@2b', turma: '2B', ano: 2 },
  { nome: 'Eric Gabriel Ferreira Sousa', email: 'eric.sousa@2b', turma: '2B', ano: 2 },
  { nome: 'Gabriela Ferreira Rezende', email: 'gabriela.rezende@2b', turma: '2B', ano: 2 },
  { nome: 'Geissykelle Maximo Rodrigues', email: 'geissykelle.rodrigues@2b', turma: '2B', ano: 2 },
  { nome: 'Georgi Felipe Silva de Almeida', email: 'georgi.almeida@2b', turma: '2B', ano: 2 },
  { nome: 'Heloisa Almeida Rocha', email: 'heloisa.rocha@2b', turma: '2B', ano: 2 },
  { nome: 'Henrique de Jesus Sousa', email: 'henrique.sousa@2b', turma: '2B', ano: 2 },
  { nome: 'Henrique Gabriel Carvalho Alves Queiroz', email: 'henrique.queiroz@2b', turma: '2B', ano: 2 },
  { nome: 'Isabella Matinada Santos de Jesus', email: 'isabella.jesus@2b', turma: '2B', ano: 2 },
  { nome: 'Izadora Santos Dias Nogueira', email: 'izadora.nogueira@2b', turma: '2B', ano: 2 },
  { nome: 'Joaquim Pedro Ferreira Neto', email: 'joaquim.neto@2b', turma: '2B', ano: 2 },
  { nome: 'Kaiky Gabriel Sousa Araujo', email: 'kaiky.araujo@2b', turma: '2B', ano: 2 },
  { nome: 'Kauan Christian Montel Lopes de Sousa', email: 'kauan.sousa@2b', turma: '2B', ano: 2 },
  { nome: 'Laura Ribeiro Simplicio', email: 'laura.simplicio@2b', turma: '2B', ano: 2 },
  { nome: 'Laura Vitoria Alves Carvalho', email: 'laura.carvalho@2b', turma: '2B', ano: 2 },
  { nome: 'Lucas Bezerra de Queiroz', email: 'lucas.queiroz@2b', turma: '2B', ano: 2 },
  { nome: 'Michelly Araujo Silva', email: 'michelly.silva@2b', turma: '2B', ano: 2 },
  { nome: 'Mikaelly Sena Souza', email: 'mikaelly.souza@2b', turma: '2B', ano: 2 },
  { nome: 'Monique Salvador Santos', email: 'monique.santos@2b', turma: '2B', ano: 2 },
  { nome: 'Narrayra Pereira Nunes', email: 'narrayra.nunes@2b', turma: '2B', ano: 2 },
  { nome: 'Paula do Carmo Martins', email: 'paula.martins@2b', turma: '2B', ano: 2 },
  { nome: 'Paulo Victor Pinheiro Silva Brito', email: 'paulo.brito@2b', turma: '2B', ano: 2 },
  { nome: 'Pedro da Veiga Jardim Sarques', email: 'pedro.sarques@2b', turma: '2B', ano: 2 },
  { nome: 'Pedro Henrique Braz Bispo', email: 'pedro.bispo@2b', turma: '2B', ano: 2 },
  { nome: 'Pedro Sobrinho Ribeiro Gomes', email: 'pedro.gomes@2b', turma: '2B', ano: 2 },
  { nome: 'Raislan Dias Rodrigues', email: 'raislan.rodrigues@2b', turma: '2B', ano: 2 },
  { nome: 'Rapha de Campos Baldan Ferreira', email: 'rapha.ferreira@2b', turma: '2B', ano: 2 },
  { nome: 'Roberto Scaglia Netto', email: 'roberto.netto@2b', turma: '2B', ano: 2 },
  { nome: 'Samara Laiz Ferreira de Sousa', email: 'samara.sousa@2b', turma: '2B', ano: 2 },
  { nome: 'Samuel Juliao de Sousa', email: 'samuel.sousa@2b', turma: '2B', ano: 2 },
  { nome: 'Samuell de Souza Cardoso', email: 'samuell.cardoso@2b', turma: '2B', ano: 2 },
  { nome: 'Sara Eduarda da Silva Vieira Rosa', email: 'sara.rosa@2b', turma: '2B', ano: 2 },
  { nome: 'Savio Soares Oliveira', email: 'savio.oliveira@2b', turma: '2B', ano: 2 },
  // TURMA 3A (37)
  { nome: 'Adrielly Alves Correia Rodrigues', email: 'adrielly.rodrigues@3a', turma: '3A', ano: 3 },
  { nome: 'Ana Carolina Ferreira Balduino', email: 'ana.balduino@3a', turma: '3A', ano: 3 },
  { nome: 'Ana Clara Garcia da Silva', email: 'ana.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Antoniel Breno Ferreira de Souza', email: 'antoniel.souza@3a', turma: '3A', ano: 3 },
  { nome: 'Arleyson Andrade Silva', email: 'arleyson.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Eduardo Cabral Santos', email: 'eduardo.santos@3a', turma: '3A', ano: 3 },
  { nome: 'Clarice Barauna Santos', email: 'clarice.santos@3a', turma: '3A', ano: 3 },
  { nome: 'Emanuely dos Santos Nascimento', email: 'emanuely.nascimento@3a', turma: '3A', ano: 3 },
  { nome: 'Emyle Ayala Mendonca Batista', email: 'emyle.batista@3a', turma: '3A', ano: 3 },
  { nome: 'Enzo Francisco Neves', email: 'enzo.neves@3a', turma: '3A', ano: 3 },
  { nome: 'Gabriel Henrique Montel Magalhaes', email: 'gabriel.magalhaes@3a', turma: '3A', ano: 3 },
  { nome: 'Gabriela Rodrigues Rocha', email: 'gabriela.rocha@3a', turma: '3A', ano: 3 },
  { nome: 'Gabriely Vitoria dos Santos Ribeiro', email: 'gabriely.ribeiro@3a', turma: '3A', ano: 3 },
  { nome: 'Helane dos Santos Sousa', email: 'helane.sousa@3a', turma: '3A', ano: 3 },
  { nome: 'Helen Maria Brito Sousa', email: 'helen.sousa@3a', turma: '3A', ano: 3 },
  { nome: 'Iagon Silva', email: 'iagon.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Ingredy Cristina Rodrigues Pereira', email: 'ingredy.pereira@3a', turma: '3A', ano: 3 },
  { nome: 'Isadora Marques de Moura', email: 'isadora.moura@3a', turma: '3A', ano: 3 },
  { nome: 'Islaete da Conceicao de Oliveira Dias', email: 'islaete.dias@3a', turma: '3A', ano: 3 },
  { nome: 'Joao Vitor Paiva Camargo', email: 'joao.camargo@3a', turma: '3A', ano: 3 },
  { nome: 'Klerys da Silva Ferreira', email: 'klerys.ferreira@3a', turma: '3A', ano: 3 },
  { nome: 'Ludmilla Garcia da Silva Ferreira', email: 'ludmilla.ferreira@3a', turma: '3A', ano: 3 },
  { nome: 'Maria Eduarda Souza Siqueira', email: 'maria.siqueira@3a', turma: '3A', ano: 3 },
  { nome: 'Mayck Vinicius Custodio Firmo', email: 'mayck.firmo@3a', turma: '3A', ano: 3 },
  { nome: 'Melissa Nunes da Silva', email: 'melissa.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Paulo Vitor Pimenta Rodrigues', email: 'paulo.rodrigues@3a', turma: '3A', ano: 3 },
  { nome: 'Radja Hilary dos Santos Carvalho', email: 'radja.carvalho@3a', turma: '3A', ano: 3 },
  { nome: 'Raila Alves de Sousa', email: 'raila.sousa@3a', turma: '3A', ano: 3 },
  { nome: 'Sthefany de Carvalho Fonseca', email: 'sthefany.fonseca@3a', turma: '3A', ano: 3 },
  { nome: 'Talita Santos de Sousa', email: 'talita.sousa@3a', turma: '3A', ano: 3 },
  { nome: 'Tiago Mendes de Oliveira', email: 'tiago.oliveira@3a', turma: '3A', ano: 3 },
  { nome: 'Vitor Hugo Faustino dos Reis', email: 'vitor.reis@3a', turma: '3A', ano: 3 },
  { nome: 'Vitor Tharlles Barbosa da Silva', email: 'vitor.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Walisson Richard Rosa Silva', email: 'walisson.silva@3a', turma: '3A', ano: 3 },
  { nome: 'Washington Luis Gomes Junior', email: 'washington.junior@3a', turma: '3A', ano: 3 },
  { nome: 'Widson Henrique de Sousa Vieira', email: 'widson.vieira@3a', turma: '3A', ano: 3 },
  { nome: 'Yara Camilly da Silva Feitosa', email: 'yara.feitosa@3a', turma: '3A', ano: 3 },
  // TURMA 3B (37)
  { nome: 'Ahudiel Daniel da Silva Placido', email: 'ahudiel.placido@3b', turma: '3B', ano: 3 },
  { nome: 'Aliciane Correia da Silva Avila', email: 'aliciane.avila@3b', turma: '3B', ano: 3 },
  { nome: 'Ana Julia Rodrigues de Avila', email: 'ana.avila@3b', turma: '3B', ano: 3 },
  { nome: 'Ana Luiza Lopes da Silva', email: 'ana.silva@3b', turma: '3B', ano: 3 },
  { nome: 'Brenno Jonatha Frota Souza Santana', email: 'brenno.santana@3b', turma: '3B', ano: 3 },
  { nome: 'Caua Souza Querino dos Santos', email: 'caua.santos@3b', turma: '3B', ano: 3 },
  { nome: 'Daniel Costa Batista', email: 'daniel.batista@3b', turma: '3B', ano: 3 },
  { nome: 'Daniel da Silva Aguiar', email: 'daniel.aguiar@3b', turma: '3B', ano: 3 },
  { nome: 'Dionatha Gabriella de Sousa Ribeiro', email: 'dionatha.ribeiro@3b', turma: '3B', ano: 3 },
  { nome: 'Emilly Santos de Oliveira', email: 'emilly.oliveira@3b', turma: '3B', ano: 3 },
  { nome: 'Erick Antunes Duarte', email: 'erick.duarte@3b', turma: '3B', ano: 3 },
  { nome: 'Fernanda Lopes de Lima', email: 'fernanda.lima@3b', turma: '3B', ano: 3 },
  { nome: 'Frederico Soares Colaco', email: 'frederico.colaco@3b', turma: '3B', ano: 3 },
  { nome: 'Gustavo Soares de Almeida', email: 'gustavo.almeida@3b', turma: '3B', ano: 3 },
  { nome: 'Joao Pedro Rocha Jordao Oliveira', email: 'joao.oliveira@3b', turma: '3B', ano: 3 },
  { nome: 'Jose Henrique Leme Barbosa', email: 'jose.barbosa@3b', turma: '3B', ano: 3 },
  { nome: 'Kael Christian Dias Lopes', email: 'kael.lopes@3b', turma: '3B', ano: 3 },
  { nome: 'Lara Vitoria Carneiro Ornelas', email: 'lara.ornelas@3b', turma: '3B', ano: 3 },
  { nome: 'Laura Kellys Alves de Souza', email: 'laura.souza@3b', turma: '3B', ano: 3 },
  { nome: 'Luiz Henrique Souza Santos', email: 'luiz.santos@3b', turma: '3B', ano: 3 },
  { nome: 'Luiz Miguel Martins do Amaral Cruz', email: 'luiz.cruz@3b', turma: '3B', ano: 3 },
  { nome: 'Micael Wesley de Carvalho Lima', email: 'micael.lima@3b', turma: '3B', ano: 3 },
  { nome: 'Murilo Tiburcio Vieira', email: 'murilo.vieira@3b', turma: '3B', ano: 3 },
  { nome: 'Paulo Henrique Araujo Barbosa', email: 'paulo.barbosa@3b', turma: '3B', ano: 3 },
  { nome: 'Paulo Henrique Rodrigues dos Santos', email: 'paulo.santos@3b', turma: '3B', ano: 3 },
  { nome: 'Pietro Augusto Vital Farias', email: 'pietro.farias@3b', turma: '3B', ano: 3 },
  { nome: 'Reinan Gomes Paiva', email: 'reinan.paiva@3b', turma: '3B', ano: 3 },
  { nome: 'Ricardo Gabriel Magalhaes Pardim', email: 'ricardo.pardim@3b', turma: '3B', ano: 3 },
  { nome: 'Riquelme Faria da Silva', email: 'riquelme.silva@3b', turma: '3B', ano: 3 },
  { nome: 'Samuel Henrique Santos', email: 'samuel.santos@3b', turma: '3B', ano: 3 },
  { nome: 'Talita Alves Vieira', email: 'talita.vieira@3b', turma: '3B', ano: 3 },
  { nome: 'Terezinha Vittoria Araujo da Silva', email: 'terezinha.silva@3b', turma: '3B', ano: 3 },
  { nome: 'Thomaz Dhavith Meirjan Peres', email: 'thomaz.peres@3b', turma: '3B', ano: 3 },
  { nome: 'Yasmin Moraes Marques', email: 'yasmin.marques@3b', turma: '3B', ano: 3 },
  { nome: 'Yohara Hendelly Santos da Silva', email: 'yohara.silva@3b', turma: '3B', ano: 3 },
  { nome: 'Zahara Farias Gomes', email: 'zahara.gomes@3b', turma: '3B', ano: 3 },
  { nome: 'Pedro Alexandre Campos da Cruz', email: 'pedro.cruz@3b', turma: '3B', ano: 3 },
  // TURMA 3C (29)
  { nome: 'Ana Beatriz Rocha Silva', email: 'ana.silva@3c', turma: '3C', ano: 3 },
  { nome: 'Ana Carolina Monteiro Chaves', email: 'ana.chaves@3c', turma: '3C', ano: 3 },
  { nome: 'Ana Flavia Goncalves da Cruz', email: 'ana.cruz@3c', turma: '3C', ano: 3 },
  { nome: 'Ana Vitoria Abreu Martins', email: 'ana.martins@3c', turma: '3C', ano: 3 },
  { nome: 'Andrielly Santos Rodrigues', email: 'andrielly.rodrigues@3c', turma: '3C', ano: 3 },
  { nome: 'Anna Julia Alves Arantes', email: 'anna.arantes@3c', turma: '3C', ano: 3 },
  { nome: 'Eduardo da Silva Cabral', email: 'eduardo.cabral@3c', turma: '3C', ano: 3 },
  { nome: 'Ezequiel da Silva Italiano', email: 'ezequiel.italiano@3c', turma: '3C', ano: 3 },
  { nome: 'Gabrielly Oliveira de Sousa', email: 'gabrielly.sousa@3c', turma: '3C', ano: 3 },
  { nome: 'Grazielly Nunes de Jesus', email: 'grazielly.jesus@3c', turma: '3C', ano: 3 },
  { nome: 'Guttemberg Alencar de Castro', email: 'guttemberg.castro@3c', turma: '3C', ano: 3 },
  { nome: 'Ianna Valeska Mendes Diniz', email: 'ianna.diniz@3c', turma: '3C', ano: 3 },
  { nome: 'Isabela Costa Silva', email: 'isabela.silva@3c', turma: '3C', ano: 3 },
  { nome: 'Isabella Ferreira Machado', email: 'isabella.machado@3c', turma: '3C', ano: 3 },
  { nome: 'Joao Fellipe Pontes Neves Barbosa', email: 'joao.barbosa@3c', turma: '3C', ano: 3 },
  { nome: 'Joao Pedro de Sousa Soares', email: 'joao.soares@3c', turma: '3C', ano: 3 },
  { nome: 'Juliani Alves Ferreira', email: 'juliani.ferreira@3c', turma: '3C', ano: 3 },
  { nome: 'Kauan Souza Santos', email: 'kauan.santos@3c', turma: '3C', ano: 3 },
  { nome: 'Kleberson Pereira Nunes', email: 'kleberson.nunes@3c', turma: '3C', ano: 3 },
  { nome: 'Luis Fernando de Souza Pires', email: 'luis.pires@3c', turma: '3C', ano: 3 },
  { nome: 'Luiz Fernando Halley Muller', email: 'luiz.muller@3c', turma: '3C', ano: 3 },
  { nome: 'Mariana Harzer Gomes Quintas', email: 'mariana.quintas@3c', turma: '3C', ano: 3 },
  { nome: 'Miguel Lemos da Silva', email: 'miguel.silva@3c', turma: '3C', ano: 3 },
  { nome: 'Rafael de Oliveira Vieira', email: 'rafael.vieira@3c', turma: '3C', ano: 3 },
  { nome: 'Renilton Martins Lima da Costa', email: 'renilton.costa@3c', turma: '3C', ano: 3 },
  { nome: 'Riquelme Vitor Silva Nobrega', email: 'riquelme.nobrega@3c', turma: '3C', ano: 3 },
  { nome: 'Ryan Matheus Oliveira Viana', email: 'ryan.viana@3c', turma: '3C', ano: 3 },
  { nome: 'Victor Juscelino Leite Lima', email: 'victor.lima@3c', turma: '3C', ano: 3 },
  { nome: 'Yan Gustavo Nunes da Silva', email: 'yan.silva@3c', turma: '3C', ano: 3 },
]

// Funcao principal para cadastrar usando insert direto com bcrypt
async function cadastrar() {
  console.log('===============================================================')
  console.log('  CADASTRO DE ESTUDANTES DE FISICA - CORA CORALINA')
  console.log('===============================================================')
  console.log(`Total: ${estudantes.length} estudantes`)
  console.log('')

  // Gerar hash da senha padrao (mesmo hash para todos)
  console.log('Gerando hash da senha...')
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)
  console.log('Hash gerado com sucesso!')
  console.log('')

  let novos = 0, atualizados = 0, erros = 0

  // Processar em lotes de 50 para melhor performance
  const BATCH_SIZE = 50
  for (let i = 0; i < estudantes.length; i += BATCH_SIZE) {
    const batch = estudantes.slice(i, i + BATCH_SIZE)

    // Preparar dados do lote
    const dados = batch.map(est => ({
      email: est.email,
      senha_hash: senhaHash,
      nome: est.nome,
      turma: est.turma,
      colegio: 'Cora Coralina',
      ano: est.ano,
      nivel: 'EM',
      componentes: ['fisica'],
      tipo: 'estudante'
    }))

    // Upsert - insere ou atualiza se existir
    const { data, error } = await supabase
      .from('usuario')
      .upsert(dados, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select('email')

    if (error) {
      console.log(`\nErro no lote ${i/BATCH_SIZE + 1}: ${error.message}`)
      erros += batch.length
    } else {
      // Contar quantos foram processados
      const processados = data ? data.length : batch.length
      novos += processados
      process.stdout.write(`[${Math.min(i + BATCH_SIZE, estudantes.length)}/${estudantes.length}] `)
    }
  }

  console.log('\n')
  console.log('===============================================================')
  console.log(`  Processados: ${novos}`)
  console.log(`  Erros: ${erros}`)
  console.log('===============================================================')
  console.log('')
  console.log('Login: primeironome.ultimonome@turma')
  console.log('Senha: @estudante')
  console.log('')
  console.log('Exemplo: alexandre.souto@1a / @estudante')
}

cadastrar().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
