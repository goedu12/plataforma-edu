-- ═══════════════════════════════════════════════════════════════════════════
-- IMPORTAÇÃO DE ESTUDANTES DE FÍSICA - COLÉGIO CORA CORALINA
-- Total: 279 estudantes
-- Turmas: 1A, 1B, 2A, 2B, 3A, 3B, 3C
-- Componente: Física
-- Senha padrão: @estudante
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 1A - 1ª SÉRIE (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('alexandre.souto@1a', crypt('@estudante', gen_salt('bf')), 'Alexandre de Freitas Souto', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('aline.rodrigues@1a', crypt('@estudante', gen_salt('bf')), 'Aline Alves Correia Rodrigues', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.pedroira@1a', crypt('@estudante', gen_salt('bf')), 'Ana Ester da Silva Pedroira', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ariel.monteiro@1a', crypt('@estudante', gen_salt('bf')), 'Ariel de Nazaré Monteiro', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('arthur.silva@1a', crypt('@estudante', gen_salt('bf')), 'Arthur Lemes Silva', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('arthur.santos@1a', crypt('@estudante', gen_salt('bf')), 'Arthur Rodrigues Cardoso dos Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('benjamin.santos@1a', crypt('@estudante', gen_salt('bf')), 'Benjamin Kevin Ramirez dos Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('clarisse.oliveira@1a', crypt('@estudante', gen_salt('bf')), 'Clarisse Ribeiro de Oliveira', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('cristiano.santos@1a', crypt('@estudante', gen_salt('bf')), 'Cristiano Barauna Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daniel.sousa@1a', crypt('@estudante', gen_salt('bf')), 'Daniel Ribeiro de Sousa', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('davi.chaves@1a', crypt('@estudante', gen_salt('bf')), 'Davi Giuvana Silva Chaves', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eduardo.silva@1a', crypt('@estudante', gen_salt('bf')), 'Eduardo Cardoso Silva', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ellen.xavier@1a', crypt('@estudante', gen_salt('bf')), 'Ellen Sousa Xavier', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('emilly.nascimento@1a', crypt('@estudante', gen_salt('bf')), 'Emilly Mikaelle Sales Nascimento', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('enzo.sousa@1a', crypt('@estudante', gen_salt('bf')), 'Enzo Kaiuqe Ferreira Lima Sousa', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('francisco.araujo@1a', crypt('@estudante', gen_salt('bf')), 'Francisco Rayan Oliveira de Araújo', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriel.castro@1a', crypt('@estudante', gen_salt('bf')), 'Gabriel Ortiz Ribeiro de Castro', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gustavo.rocha@1a', crypt('@estudante', gen_salt('bf')), 'Gustavo Gabriel Lima Rocha', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('heitor.oliveira@1a', crypt('@estudante', gen_salt('bf')), 'Heitor Dias de Oliveira', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isabela.castro@1a', crypt('@estudante', gen_salt('bf')), 'Isabela Lira Castro', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('italo.gomes@1a', crypt('@estudante', gen_salt('bf')), 'Ítalo André Chaves Gomes', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.carvalho@1a', crypt('@estudante', gen_salt('bf')), 'João Paulo Pereira de Carvalho', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kailane.leite@1a', crypt('@estudante', gen_salt('bf')), 'Kailane Pereira Leite', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kaua.araujo@1a', crypt('@estudante', gen_salt('bf')), 'Kauã Mariane Rodrigues Araújo', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kaua.ribeiro@1a', crypt('@estudante', gen_salt('bf')), 'Kauã Alves Ribeiro', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('keny.carvalho@1a', crypt('@estudante', gen_salt('bf')), 'Keny Costa Carvalho', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kleber.sena@1a', crypt('@estudante', gen_salt('bf')), 'Kleber Augusto Ferreira Sena', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('lara.queiroz@1a', crypt('@estudante', gen_salt('bf')), 'Lara Galvão Queiroz', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('laura.nascimento@1a', crypt('@estudante', gen_salt('bf')), 'Laura Cristina do Nascimento', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luan.anjos@1a', crypt('@estudante', gen_salt('bf')), 'Luan Tavares dos Anjos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('lucas.nascimento@1a', crypt('@estudante', gen_salt('bf')), 'Lucas Lima Nascimento', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maelen.santos@1a', crypt('@estudante', gen_salt('bf')), 'Maelen Ramos dos Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.silva@1a', crypt('@estudante', gen_salt('bf')), 'Maria Gabriella Rosa Stival Silva', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.travasso@1a', crypt('@estudante', gen_salt('bf')), 'Maria Rosa Gonçalves Travasso', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('nathavus.santos@1a', crypt('@estudante', gen_salt('bf')), 'Nathavus Pereira Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('matheus.mendes@1a', crypt('@estudante', gen_salt('bf')), 'Matheus Araújo Mendes', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('miguel.aragao@1a', crypt('@estudante', gen_salt('bf')), 'Miguel Santos Aragão', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.lopes@1a', crypt('@estudante', gen_salt('bf')), 'Paulo Eduardo Máximo Lopes', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.silva@1a', crypt('@estudante', gen_salt('bf')), 'Pedro Henrique Rabelo da Silva', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('rafaela.goncalves@1a', crypt('@estudante', gen_salt('bf')), 'Rafaela Fernandes Gonçalves', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuel.cruz@1a', crypt('@estudante', gen_salt('bf')), 'Samuel Henrique Mendes da Cruz', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('weverson.figueiredo@1a', crypt('@estudante', gen_salt('bf')), 'Weverson Junior Gorgonha Figueiredo', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yasmim.santos@1a', crypt('@estudante', gen_salt('bf')), 'Yasmim Alves dos Santos', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yasmim.torres@1a', crypt('@estudante', gen_salt('bf')), 'Yasmim Fernanda Torres', '1A', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 1B - 1ª SÉRIE (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('alexandre.andrade@1b', crypt('@estudante', gen_salt('bf')), 'Alexandre Ferreira dos Santos Andrade', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.sousa@1b', crypt('@estudante', gen_salt('bf')), 'Ana Carolina de Oliveira Sousa', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('carlos.filho@1b', crypt('@estudante', gen_salt('bf')), 'Carlos Eduardo Machado da Costa Filho', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daniel.silva@1b', crypt('@estudante', gen_salt('bf')), 'Daniel Rodrigues de Olho da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('derick.pinto@1b', crypt('@estudante', gen_salt('bf')), 'Derick Rennan Diniz Pinto', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eduardo.silva@1b', crypt('@estudante', gen_salt('bf')), 'Eduardo Coutinho Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('elizabete.rodrigues@1b', crypt('@estudante', gen_salt('bf')), 'Elizabete Silva Rodrigues', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriel.silva@1b', crypt('@estudante', gen_salt('bf')), 'Gabriel Henrique Nascimento da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriel.amaral@1b', crypt('@estudante', gen_salt('bf')), 'Gabriel Sousa Amaral', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriele.goncalves@1b', crypt('@estudante', gen_salt('bf')), 'Gabriele Reis Gonçalves', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriella.cavalcante@1b', crypt('@estudante', gen_salt('bf')), 'Gabriella Paraguaçu Machado Cavalcante', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('guilherme.silva@1b', crypt('@estudante', gen_salt('bf')), 'Guilherme Carmo da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('guilherme.filho@1b', crypt('@estudante', gen_salt('bf')), 'Guilherme Mendes Vieira Filho', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('hayla.ribeiro@1b', crypt('@estudante', gen_salt('bf')), 'Hayla Rodrigues Ribeiro', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isabela.aguiar@1b', crypt('@estudante', gen_salt('bf')), 'Isabela da Silva Aguiar', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('istefani.santos@1b', crypt('@estudante', gen_salt('bf')), 'Istefani da Silva dos Santos', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('italo.oliveira@1b', crypt('@estudante', gen_salt('bf')), 'Ítalo de Castro Silva Oliveira', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('izabela.santos@1b', crypt('@estudante', gen_salt('bf')), 'Izabela Lima dos Santos', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('jean.sa@1b', crypt('@estudante', gen_salt('bf')), 'Jean Vinicius Araújo de Sá', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.nogueira@1b', crypt('@estudante', gen_salt('bf')), 'João Gabriel Nogueira', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.silva@1b', crypt('@estudante', gen_salt('bf')), 'João Pedro Alves da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.santos@1b', crypt('@estudante', gen_salt('bf')), 'João Pedro Viana Santos', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.almeida@1b', crypt('@estudante', gen_salt('bf')), 'João Victor Evangelista de Almeida', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kauan.sales@1b', crypt('@estudante', gen_salt('bf')), 'Kauan Victor Garcia Sales', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('liara.silva@1b', crypt('@estudante', gen_salt('bf')), 'Liara Rosa Rodrigues da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('liara.cruvinel@1b', crypt('@estudante', gen_salt('bf')), 'Liara Cruvinel da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luis.ferreira@1b', crypt('@estudante', gen_salt('bf')), 'Luis Fernando Santos Ferreira', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luis.nogueira@1b', crypt('@estudante', gen_salt('bf')), 'Luis Fernando Santos Dias Nogueira', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luiz.sousa@1b', crypt('@estudante', gen_salt('bf')), 'Luiz Otávio Oliveira de Sousa', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('manuella.barbosa@1b', crypt('@estudante', gen_salt('bf')), 'Manuella Moreira da Silva Barbosa', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.silva@1b', crypt('@estudante', gen_salt('bf')), 'Maria Eduarda da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('matheus.carvalho@1b', crypt('@estudante', gen_salt('bf')), 'Matheus de Macedo Carvalho', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('matheus.lima@1b', crypt('@estudante', gen_salt('bf')), 'Matheus Guimarães de Medeiros Lima', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('miguel.silva@1b', crypt('@estudante', gen_salt('bf')), 'Miguel Caleb Souza Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('mikael.correa@1b', crypt('@estudante', gen_salt('bf')), 'Mikael da Costa Corrêa', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('nadielly.silva@1b', crypt('@estudante', gen_salt('bf')), 'Nadielly Faustino da Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.seixas@1b', crypt('@estudante', gen_salt('bf')), 'Pedro Soares Seixas', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pietro.pereira@1b', crypt('@estudante', gen_salt('bf')), 'Pietro Jefferson Diniz Pereira', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('victor.mendanha@1b', crypt('@estudante', gen_salt('bf')), 'Victor Hugo de Souza Mendanha', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vinicius.silva@1b', crypt('@estudante', gen_salt('bf')), 'Vinicius Inácio Silva', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vitor.costa@1b', crypt('@estudante', gen_salt('bf')), 'Vitor Gabriel Santos Costa', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yasmin.matos@1b', crypt('@estudante', gen_salt('bf')), 'Yasmin Silva Matos', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yasmin.santos@1b', crypt('@estudante', gen_salt('bf')), 'Yasmin Alves dos Santos', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yuri.cruz@1b', crypt('@estudante', gen_salt('bf')), 'Yuri Gabriel da Silva Cruz', '1B', 'Cora Coralina', 1, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2A - 2ª SÉRIE (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('adalto.barros@2a', crypt('@estudante', gen_salt('bf')), 'Adalto Victor Oliveira Barros', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('amanda.oliveira@2a', crypt('@estudante', gen_salt('bf')), 'Amanda Alves de Oliveira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.andrade@2a', crypt('@estudante', gen_salt('bf')), 'Ana Clara Ferreira dos Santos Andrade', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.souza@2a', crypt('@estudante', gen_salt('bf')), 'Ana Luiza Lima Souza', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('antonio.silva@2a', crypt('@estudante', gen_salt('bf')), 'Antonio Rai Souza da Silva', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('arthur.brito@2a', crypt('@estudante', gen_salt('bf')), 'Arthur Ferreira Brito', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('cristiane.nascimento@2a', crypt('@estudante', gen_salt('bf')), 'Cristiane de Sousa Nascimento', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daize.cruz@2a', crypt('@estudante', gen_salt('bf')), 'Daize Wanessa Maciel da Cruz', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('davi.silva@2a', crypt('@estudante', gen_salt('bf')), 'Davi Augusto de Andrade Silva', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('deyvid.pereira@2a', crypt('@estudante', gen_salt('bf')), 'Deyvid Lucas Lopes Pereira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('giovana.santos@2a', crypt('@estudante', gen_salt('bf')), 'Giovana das Neves Santos', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('guilherme.braga@2a', crypt('@estudante', gen_salt('bf')), 'Guilherme Alves Guimarães Araujo Braga', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gustavo.oliveira@2a', crypt('@estudante', gen_salt('bf')), 'Gustavo Felipe Costa de Oliveira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('hemanuele.brauna@2a', crypt('@estudante', gen_salt('bf')), 'Hemanuele Narciso Braúna', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('hiarley.santos@2a', crypt('@estudante', gen_salt('bf')), 'Hiarley Davi Tavares dos Santos', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isaac.cunha@2a', crypt('@estudante', gen_salt('bf')), 'Isaac Martins da Cunha', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isaque.gomes@2a', crypt('@estudante', gen_salt('bf')), 'Isaque Chaves Gomes', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('jhevilly.souza@2a', crypt('@estudante', gen_salt('bf')), 'Jhevilly Maria da Conceição Souza', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.rodrigues@2a', crypt('@estudante', gen_salt('bf')), 'João Pedro Loterio Rodrigues', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('jose.peres@2a', crypt('@estudante', gen_salt('bf')), 'José Alfredo da Silva Peres', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('karla.farias@2a', crypt('@estudante', gen_salt('bf')), 'Karla Mikaelly Chaves Farias', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kayon.silva@2a', crypt('@estudante', gen_salt('bf')), 'Kayon Henrique Rodrigues da Silva', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kezia.santana@2a', crypt('@estudante', gen_salt('bf')), 'Kézia Costa Santana', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kristyane.sandes@2a', crypt('@estudante', gen_salt('bf')), 'Kristyane Ferreira Sandes', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('lucas.borges@2a', crypt('@estudante', gen_salt('bf')), 'Lucas da Silva Borges', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ludmila.nascimento@2a', crypt('@estudante', gen_salt('bf')), 'Ludmila Marques Nascimento', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luiz.cruz@2a', crypt('@estudante', gen_salt('bf')), 'Luiz Fernando Mendes da Cruz', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.barbosa@2a', crypt('@estudante', gen_salt('bf')), 'Maria Clara Benevides Vasco Barbosa', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.lobo@2a', crypt('@estudante', gen_salt('bf')), 'Maria Fernanda de Souza Lobo', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('matheus.alves@2a', crypt('@estudante', gen_salt('bf')), 'Matheus Rikelme Araujo Alves', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('mayk.cezar@2a', crypt('@estudante', gen_salt('bf')), 'Mayk Pereira Cezar', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('miqueias.nascimento@2a', crypt('@estudante', gen_salt('bf')), 'Miqueias da Silva Nascimento', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.serra@2a', crypt('@estudante', gen_salt('bf')), 'Paulo Victor Matos Serra', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pietro.santos@2a', crypt('@estudante', gen_salt('bf')), 'Pietro Ferreira dos Santos', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ronald.oliveira@2a', crypt('@estudante', gen_salt('bf')), 'Ronald Araujo Oliveira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuel.oliveira@2a', crypt('@estudante', gen_salt('bf')), 'Samuel Rodrigues de Oliveira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuel.silva@2a', crypt('@estudante', gen_salt('bf')), 'Samuel Taylor da Silva', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('saul.monteiro@2a', crypt('@estudante', gen_salt('bf')), 'Saul Isaac Batista Monteiro', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('taina.morais@2a', crypt('@estudante', gen_salt('bf')), 'Tainá Ferreira de Morais', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('tulio.mota@2a', crypt('@estudante', gen_salt('bf')), 'Túlio Barbosa de Melo Mota', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vanessa.ferreira@2a', crypt('@estudante', gen_salt('bf')), 'Vanessa da Silva Ferreira', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('victor.silva@2a', crypt('@estudante', gen_salt('bf')), 'Victor Emanuel Neves Silva', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vitor.lima@2a', crypt('@estudante', gen_salt('bf')), 'Vitor Gabriel Mendes Teles Lima', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ysla.lopes@2a', crypt('@estudante', gen_salt('bf')), 'Ysla Manuella da Silva Lopes', '2A', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2B - 2ª SÉRIE (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('ana.alves@2b', crypt('@estudante', gen_salt('bf')), 'Ana Julia Rodrigues Alves', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('antonio.feitosa@2b', crypt('@estudante', gen_salt('bf')), 'Antonio Rian Castro Feitosa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('bruno.marinho@2b', crypt('@estudante', gen_salt('bf')), 'Bruno Vitoriano Marinho', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('carla.santana@2b', crypt('@estudante', gen_salt('bf')), 'Carla Geovanna Paiva Santana', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('chayra.silva@2b', crypt('@estudante', gen_salt('bf')), 'Chayra Corrêa da Silva', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daniel.santos@2b', crypt('@estudante', gen_salt('bf')), 'Daniel Souza Santos', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('darlan.ribeiro@2b', crypt('@estudante', gen_salt('bf')), 'Darlan Brito Ribeiro', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('davy.oliveira@2b', crypt('@estudante', gen_salt('bf')), 'Davy Gustavo Pereira de Oliveira', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('dionne.junior@2b', crypt('@estudante', gen_salt('bf')), 'Dionne Cleiton Correia Muniz Júnior', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('edclecio.santos@2b', crypt('@estudante', gen_salt('bf')), 'Edclecio Sousa dos Santos', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eloisa.silva@2b', crypt('@estudante', gen_salt('bf')), 'Eloisa Martins da Silva', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('emilly.lobo@2b', crypt('@estudante', gen_salt('bf')), 'Emilly Guimaraes Lobo', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eric.sousa@2b', crypt('@estudante', gen_salt('bf')), 'Eric Gabriel Ferreira Sousa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriela.rezende@2b', crypt('@estudante', gen_salt('bf')), 'Gabriela Ferreira Rezende', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('geissykelle.rodrigues@2b', crypt('@estudante', gen_salt('bf')), 'Geissykelle Máximo Rodrigues', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('georgi.almeida@2b', crypt('@estudante', gen_salt('bf')), 'Georgi Felipe Silva de Almeida', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('heloisa.rocha@2b', crypt('@estudante', gen_salt('bf')), 'Heloísa Almeida Rocha', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('henrique.sousa@2b', crypt('@estudante', gen_salt('bf')), 'Henrique de Jesus Sousa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('henrique.queiroz@2b', crypt('@estudante', gen_salt('bf')), 'Henrique Gabriel Carvalho Alves Queiroz', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isabella.jesus@2b', crypt('@estudante', gen_salt('bf')), 'Isabella Matinada Santos de Jesus', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('izadora.nogueira@2b', crypt('@estudante', gen_salt('bf')), 'Izadora Santos Dias Nogueira', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joaquim.neto@2b', crypt('@estudante', gen_salt('bf')), 'Joaquim Pedro Ferreira Neto', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kaiky.araujo@2b', crypt('@estudante', gen_salt('bf')), 'Kaiky Gabriel Sousa Araujo', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kauan.sousa@2b', crypt('@estudante', gen_salt('bf')), 'Kauan Christian Montel Lopes de Sousa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('laura.simplicio@2b', crypt('@estudante', gen_salt('bf')), 'Laura Ribeiro Simplicio', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('laura.carvalho@2b', crypt('@estudante', gen_salt('bf')), 'Laura Vitória Alves Carvalho', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('lucas.queiroz@2b', crypt('@estudante', gen_salt('bf')), 'Lucas Bezerra de Queiroz', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('michelly.silva@2b', crypt('@estudante', gen_salt('bf')), 'Michelly Araujo Silva', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('mikaelly.souza@2b', crypt('@estudante', gen_salt('bf')), 'Mikaelly Sena Souza', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('monique.santos@2b', crypt('@estudante', gen_salt('bf')), 'Monique Salvador Santos', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('narrayra.nunes@2b', crypt('@estudante', gen_salt('bf')), 'Narrayra Pereira Nunes', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paula.martins@2b', crypt('@estudante', gen_salt('bf')), 'Paula do Carmo Martins', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.brito@2b', crypt('@estudante', gen_salt('bf')), 'Paulo Victor Pinheiro Silva Brito', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.sarques@2b', crypt('@estudante', gen_salt('bf')), 'Pedro da Veiga Jardim Sarques', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.bispo@2b', crypt('@estudante', gen_salt('bf')), 'Pedro Henrique Braz Bispo', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.gomes@2b', crypt('@estudante', gen_salt('bf')), 'Pedro Sobrinho Ribeiro Gomes', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('raislan.rodrigues@2b', crypt('@estudante', gen_salt('bf')), 'Raislan Dias Rodrigues', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('rapha.ferreira@2b', crypt('@estudante', gen_salt('bf')), 'Raphá de Campos Baldan Ferreira', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('roberto.netto@2b', crypt('@estudante', gen_salt('bf')), 'Roberto Scaglia Netto', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samara.sousa@2b', crypt('@estudante', gen_salt('bf')), 'Samara Laiz Ferreira de Sousa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuel.sousa@2b', crypt('@estudante', gen_salt('bf')), 'Samuel Julião de Sousa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuell.cardoso@2b', crypt('@estudante', gen_salt('bf')), 'Samuell de Souza Cardoso', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('sara.rosa@2b', crypt('@estudante', gen_salt('bf')), 'Sara Eduarda da Silva Vieira Rosa', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('savio.oliveira@2b', crypt('@estudante', gen_salt('bf')), 'Sávio Soares Oliveira', '2B', 'Cora Coralina', 2, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3A - 3ª SÉRIE (37 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('adrielly.rodrigues@3a', crypt('@estudante', gen_salt('bf')), 'Adrielly Alves Correia Rodrigues', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.balduino@3a', crypt('@estudante', gen_salt('bf')), 'Ana Carolina Ferreira Balduíno', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.silva@3a', crypt('@estudante', gen_salt('bf')), 'Ana Clara Garcia da Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('antoniel.souza@3a', crypt('@estudante', gen_salt('bf')), 'Antoniel Breno Ferreira de Souza', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('arleyson.silva@3a', crypt('@estudante', gen_salt('bf')), 'Arleyson Andrade Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eduardo.santos@3a', crypt('@estudante', gen_salt('bf')), 'Eduardo Cabral Santos', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('clarice.santos@3a', crypt('@estudante', gen_salt('bf')), 'Clarice Baraúna Santos', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('emanuely.nascimento@3a', crypt('@estudante', gen_salt('bf')), 'Emanuely dos Santos Nascimento', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('emyle.batista@3a', crypt('@estudante', gen_salt('bf')), 'Emyle Ayala Mendonça Batista', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('enzo.neves@3a', crypt('@estudante', gen_salt('bf')), 'Enzo Francisco Neves', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriel.magalhaes@3a', crypt('@estudante', gen_salt('bf')), 'Gabriel Henrique Montel Magalhães', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriela.rocha@3a', crypt('@estudante', gen_salt('bf')), 'Gabriela Rodrigues Rocha', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabriely.ribeiro@3a', crypt('@estudante', gen_salt('bf')), 'Gabriely Vitória dos Santos Ribeiro', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('helane.sousa@3a', crypt('@estudante', gen_salt('bf')), 'Helane dos Santos Sousa', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('helen.sousa@3a', crypt('@estudante', gen_salt('bf')), 'Helen Maria Brito Sousa', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('iagon.silva@3a', crypt('@estudante', gen_salt('bf')), 'Iagon Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ingredy.pereira@3a', crypt('@estudante', gen_salt('bf')), 'Ingredy Cristina Rodrigues Pereira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isadora.moura@3a', crypt('@estudante', gen_salt('bf')), 'Isadora Marques de Moura', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('islaete.dias@3a', crypt('@estudante', gen_salt('bf')), 'Islaete da Conceição de Oliveira Dias', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.camargo@3a', crypt('@estudante', gen_salt('bf')), 'João Vitor Paiva Camargo', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('klerys.ferreira@3a', crypt('@estudante', gen_salt('bf')), 'Klerys da Silva Ferreira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ludmilla.ferreira@3a', crypt('@estudante', gen_salt('bf')), 'Ludmilla Garcia da Silva Ferreira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('maria.siqueira@3a', crypt('@estudante', gen_salt('bf')), 'Maria Eduarda Souza Siqueira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('mayck.firmo@3a', crypt('@estudante', gen_salt('bf')), 'Mayck Vinicius Custódio Firmo', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('melissa.silva@3a', crypt('@estudante', gen_salt('bf')), 'Melissa Nunes da Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.rodrigues@3a', crypt('@estudante', gen_salt('bf')), 'Paulo Vitor Pimenta Rodrigues', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('radja.carvalho@3a', crypt('@estudante', gen_salt('bf')), 'Radja Hilary dos Santos Carvalho', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('raila.sousa@3a', crypt('@estudante', gen_salt('bf')), 'Raíla Alves de Sousa', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('sthefany.fonseca@3a', crypt('@estudante', gen_salt('bf')), 'Sthefany de Carvalho Fonseca', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('talita.sousa@3a', crypt('@estudante', gen_salt('bf')), 'Tálita Santos de Sousa', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('tiago.oliveira@3a', crypt('@estudante', gen_salt('bf')), 'Tiago Mendes de Oliveira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vitor.reis@3a', crypt('@estudante', gen_salt('bf')), 'Vitor Hugo Faustino dos Reis', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('vitor.silva@3a', crypt('@estudante', gen_salt('bf')), 'Vitor Tharlles Barbosa da Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('walisson.silva@3a', crypt('@estudante', gen_salt('bf')), 'Walisson Richard Rosa Silva', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('washington.junior@3a', crypt('@estudante', gen_salt('bf')), 'Washington Luís Gomes Júnior', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('widson.vieira@3a', crypt('@estudante', gen_salt('bf')), 'Widson Henrique de Sousa Vieira', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yara.feitosa@3a', crypt('@estudante', gen_salt('bf')), 'Yara Camilly da Silva Feitosa', '3A', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3B - 3ª SÉRIE (37 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('ahudiel.placido@3b', crypt('@estudante', gen_salt('bf')), 'Ahudiel Daniel da Silva Plácido', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('aliciane.avila@3b', crypt('@estudante', gen_salt('bf')), 'Aliciane Correia da Silva Avila', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.avila@3b', crypt('@estudante', gen_salt('bf')), 'Ana Júlia Rodrigues de Avila', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.silva@3b', crypt('@estudante', gen_salt('bf')), 'Ana Luíza Lopes da Silva', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('brenno.santana@3b', crypt('@estudante', gen_salt('bf')), 'Brenno Jonatha Frota Souza Santana', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('caua.santos@3b', crypt('@estudante', gen_salt('bf')), 'Cauã Souza Querino dos Santos', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daniel.batista@3b', crypt('@estudante', gen_salt('bf')), 'Daniel Costa Batista', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('daniel.aguiar@3b', crypt('@estudante', gen_salt('bf')), 'Daniel da Silva Aguiar', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('dionatha.ribeiro@3b', crypt('@estudante', gen_salt('bf')), 'Dionatha Gabriella de Sousa Ribeiro', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('emilly.oliveira@3b', crypt('@estudante', gen_salt('bf')), 'Emilly Santos de Oliveira', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('erick.duarte@3b', crypt('@estudante', gen_salt('bf')), 'Erick Antunes Duarte', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('fernanda.lima@3b', crypt('@estudante', gen_salt('bf')), 'Fernanda Lopes de Lima', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('frederico.colaco@3b', crypt('@estudante', gen_salt('bf')), 'Frederico Soares Colaço', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gustavo.almeida@3b', crypt('@estudante', gen_salt('bf')), 'Gustavo Soares de Almeida', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.oliveira@3b', crypt('@estudante', gen_salt('bf')), 'João Pedro Rocha Jordão Oliveira', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('jose.barbosa@3b', crypt('@estudante', gen_salt('bf')), 'José Henrique Leme Barbosa', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kael.lopes@3b', crypt('@estudante', gen_salt('bf')), 'Kael Christian Dias Lopes', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('lara.ornelas@3b', crypt('@estudante', gen_salt('bf')), 'Lara Vitória Carneiro Ornelas', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('laura.souza@3b', crypt('@estudante', gen_salt('bf')), 'Laura Kellys Alves de Souza', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luiz.santos@3b', crypt('@estudante', gen_salt('bf')), 'Luiz Henrique Souza Santos', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luiz.cruz@3b', crypt('@estudante', gen_salt('bf')), 'Luiz Miguel Martins do Amaral Cruz', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('micael.lima@3b', crypt('@estudante', gen_salt('bf')), 'Micael Wesley de Carvalho Lima', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('murilo.vieira@3b', crypt('@estudante', gen_salt('bf')), 'Murilo Tibúrcio Vieira', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.barbosa@3b', crypt('@estudante', gen_salt('bf')), 'Paulo Henrique Araújo Barbosa', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('paulo.santos@3b', crypt('@estudante', gen_salt('bf')), 'Paulo Henrique Rodrigues dos Santos', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pietro.farias@3b', crypt('@estudante', gen_salt('bf')), 'Pietro Augusto Vital Farias', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('reinan.paiva@3b', crypt('@estudante', gen_salt('bf')), 'Reinan Gomes Paiva', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ricardo.pardim@3b', crypt('@estudante', gen_salt('bf')), 'Ricardo Gabriel Magalhães Pardim', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('riquelme.silva@3b', crypt('@estudante', gen_salt('bf')), 'Riquelme Faria da Silva', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('samuel.santos@3b', crypt('@estudante', gen_salt('bf')), 'Samuel Henrique Santos', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('talita.vieira@3b', crypt('@estudante', gen_salt('bf')), 'Talita Alves Vieira', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('terezinha.silva@3b', crypt('@estudante', gen_salt('bf')), 'Terezinha Vittória Araújo da Silva', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('thomaz.peres@3b', crypt('@estudante', gen_salt('bf')), 'Thomaz Dhavith Meirjan Peres', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yasmin.marques@3b', crypt('@estudante', gen_salt('bf')), 'Yasmin Moraes Marques', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yohara.silva@3b', crypt('@estudante', gen_salt('bf')), 'Yohara Hendelly Santos da Silva', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('zahara.gomes@3b', crypt('@estudante', gen_salt('bf')), 'Zahara Farias Gomes', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('pedro.cruz@3b', crypt('@estudante', gen_salt('bf')), 'Pedro Alexandre Campos da Cruz', '3B', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3C - 3ª SÉRIE (29 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('ana.silva@3c', crypt('@estudante', gen_salt('bf')), 'Ana Beatriz Rocha Silva', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.chaves@3c', crypt('@estudante', gen_salt('bf')), 'Ana Carolina Monteiro Chaves', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.cruz@3c', crypt('@estudante', gen_salt('bf')), 'Ana Flávia Gonçalves da Cruz', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ana.martins@3c', crypt('@estudante', gen_salt('bf')), 'Ana Vitória Abreu Martins', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('andrielly.rodrigues@3c', crypt('@estudante', gen_salt('bf')), 'Andrielly Santos Rodrigues', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('anna.arantes@3c', crypt('@estudante', gen_salt('bf')), 'Anna Julia Alves Arantes', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('eduardo.cabral@3c', crypt('@estudante', gen_salt('bf')), 'Eduardo da Silva Cabral', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ezequiel.italiano@3c', crypt('@estudante', gen_salt('bf')), 'Ezequiel da Silva Italiano', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('gabrielly.sousa@3c', crypt('@estudante', gen_salt('bf')), 'Gabrielly Oliveira de Sousa', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('grazielly.jesus@3c', crypt('@estudante', gen_salt('bf')), 'Grazielly Nunes de Jesus', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('guttemberg.castro@3c', crypt('@estudante', gen_salt('bf')), 'Guttemberg Alencar de Castro', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ianna.diniz@3c', crypt('@estudante', gen_salt('bf')), 'Ianna Valeska Mendes Diniz', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isabela.silva@3c', crypt('@estudante', gen_salt('bf')), 'Isabela Costa Silva', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('isabella.machado@3c', crypt('@estudante', gen_salt('bf')), 'Isabella Ferreira Machado', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.barbosa@3c', crypt('@estudante', gen_salt('bf')), 'João Fellipe Pontes Neves Barbosa', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('joao.soares@3c', crypt('@estudante', gen_salt('bf')), 'João Pedro de Sousa Soares', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('juliani.ferreira@3c', crypt('@estudante', gen_salt('bf')), 'Juliani Alves Ferreira', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kauan.santos@3c', crypt('@estudante', gen_salt('bf')), 'Kauan Souza Santos', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('kleberson.nunes@3c', crypt('@estudante', gen_salt('bf')), 'Kleberson Pereira Nunes', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luis.pires@3c', crypt('@estudante', gen_salt('bf')), 'Luis Fernando de Souza Pires', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('luiz.muller@3c', crypt('@estudante', gen_salt('bf')), 'Luiz Fernando Halley Müller', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('mariana.quintas@3c', crypt('@estudante', gen_salt('bf')), 'Mariana Harzer Gomes Quintas', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('miguel.silva@3c', crypt('@estudante', gen_salt('bf')), 'Miguel Lemos da Silva', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('rafael.vieira@3c', crypt('@estudante', gen_salt('bf')), 'Rafael de Oliveira Vieira', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('renilton.costa@3c', crypt('@estudante', gen_salt('bf')), 'Renilton Martins Lima da Costa', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('riquelme.nobrega@3c', crypt('@estudante', gen_salt('bf')), 'Riquelme Vitor Silva Nóbrega', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('ryan.viana@3c', crypt('@estudante', gen_salt('bf')), 'Ryan Matheus Oliveira Viana', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('victor.lima@3c', crypt('@estudante', gen_salt('bf')), 'Victor Juscelino Leite Lima', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false),
  ('yan.silva@3c', crypt('@estudante', gen_salt('bf')), 'Yan Gustavo Nunes da Silva', '3C', 'Cora Coralina', 3, 'EM', ARRAY['fisica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET componentes = array_cat(usuarios.componentes, ARRAY['fisica']);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  turma,
  COUNT(*) as total_alunos
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'fisica' = ANY(componentes)
  AND tipo = 'estudante'
GROUP BY turma
ORDER BY turma;

-- Mostra total geral
SELECT
  COUNT(*) as total_estudantes_fisica
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'fisica' = ANY(componentes)
  AND tipo = 'estudante';
