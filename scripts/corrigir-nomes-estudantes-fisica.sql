-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE CORREÇÃO DE NOMES E LOGINS - ESTUDANTES DE FÍSICA
-- Colégio Estadual Cora Coralina
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 1A - CORREÇÕES (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Aline -> Allyne
UPDATE usuarios SET
    nome = 'Allyne Alves Correia Rodrigues',
    email = 'allyne.rodrigues@1a'
WHERE email = 'aline.rodrigues@1a';

-- 2. Pedroira -> Pereira
UPDATE usuarios SET
    nome = 'Ana Ester da Silva Pereira',
    email = 'ana.pereira@1a'
WHERE email = 'ana.pedroira@1a';

-- 3. Benjamin -> Benjamim
UPDATE usuarios SET
    nome = 'Benjamim Kevin Ramirez dos Santos'
WHERE email = 'benjamin.santos@1a';

-- 4. Giuvana -> Guanna
UPDATE usuarios SET
    nome = 'Davi Guanna Silva Chaves'
WHERE email = 'davi.chaves@1a';

-- 5. Mikaelle -> Mikaelly
UPDATE usuarios SET
    nome = 'Emilly Mikaelly Sales Nascimento'
WHERE email = 'emilly.nascimento@1a';

-- 6. Kaiuqe -> Kaique
UPDATE usuarios SET
    nome = 'Enzo Kaique Ferreira Lima Sousa'
WHERE email = 'enzo.sousa@1a';

-- 7. Rayan -> Raylan
UPDATE usuarios SET
    nome = 'Francisco Raylan Oliveira de Araújo'
WHERE email = 'francisco.araujo@1a';

-- 8. Isabela -> Isabella
UPDATE usuarios SET
    nome = 'Isabella Lira Castro'
WHERE email = 'isabela.castro@1a';

-- 9. Kauã Mariane -> Katllyn Mariane (nome e email)
UPDATE usuarios SET
    nome = 'Katllyn Mariane Rodrigues Araújo',
    email = 'katllyn.araujo@1a'
WHERE email = 'kaua.araujo@1a';

-- 10. Keny -> Kevly
UPDATE usuarios SET
    nome = 'Kevly Costa Carvalho',
    email = 'kevly.carvalho@1a'
WHERE email = 'keny.carvalho@1a';

-- 11. Laura Cristina -> Laura Castro
UPDATE usuarios SET
    nome = 'Laura Castro do Nascimento'
WHERE email = 'laura.nascimento@1a';

-- 12. Nathavus -> Mathayus (nome e email)
UPDATE usuarios SET
    nome = 'Mathayus Pereira Santos',
    email = 'mathayus.santos@1a'
WHERE email = 'nathavus.santos@1a';

-- 13. Adicionar Matheus da Silva Souza (substituiu Yasmim Alves dos Santos)
UPDATE usuarios SET
    nome = 'Matheus da Silva Souza',
    email = 'matheus.souza@1a'
WHERE email = 'yasmim.santos@1a';

-- 14. Figueiredo -> Figueredo
UPDATE usuarios SET
    nome = 'Weverson Junior Gorgonha Figueredo'
WHERE email = 'weverson.figueiredo@1a';

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 1B - CORREÇÕES (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Daniel Rodrigues de Olho da Silva -> Daniel Rodrigues de Oliveira
UPDATE usuarios SET
    nome = 'Daniel Rodrigues de Oliveira'
WHERE email = 'daniel.silva@1b';

-- 2. Elizabete -> Elizabeth
UPDATE usuarios SET
    nome = 'Elizabeth Silva Rodrigues',
    email = 'elizabeth.rodrigues@1b'
WHERE email = 'elizabete.rodrigues@1b';

-- 3. Istefani -> Istefany
UPDATE usuarios SET
    nome = 'Istefany da Silva dos Santos',
    email = 'istefany.santos@1b'
WHERE email = 'istefani.santos@1b';

-- 4. Ítalo -> Italo (sem acento no banco)
UPDATE usuarios SET
    nome = 'Italo de Castro Silva Oliveira'
WHERE email = 'italo.oliveira@1b';

-- 5. Kauan Victor Garcia Sales -> João Vitor Garcia Sales
UPDATE usuarios SET
    nome = 'João Vitor Garcia Sales',
    email = 'joao.sales@1b'
WHERE email = 'kauan.sales@1b';

-- 6. Liara Rosa -> Luara Rosa (nome e email)
UPDATE usuarios SET
    nome = 'Luara Rosa Rodrigues da Silva',
    email = 'luara.silva@1b'
WHERE email = 'liara.silva@1b';

-- 7. Liara Cruvinel -> Kauan Cruvinel
UPDATE usuarios SET
    nome = 'Kauan Cruvinel da Silva',
    email = 'kauan.cruvinel@1b'
WHERE email = 'liara.cruvinel@1b';

-- 8. Luis Fernando Santos Ferreira -> Luis Fernando Ferreira
UPDATE usuarios SET
    nome = 'Luis Fernando Ferreira'
WHERE email = 'luis.ferreira@1b';

-- 9. Manuella -> Manuela
UPDATE usuarios SET
    nome = 'Manuela Moreira da Silva Barbosa',
    email = 'manuela.barbosa@1b'
WHERE email = 'manuella.barbosa@1b';

-- 10. Mikael da Costa Corrêa -> Mikael da Costa Correa (sem acento)
UPDATE usuarios SET
    nome = 'Mikael da Costa Correa'
WHERE email = 'mikael.correa@1b';

-- 11. Pietro -> Pihetro
UPDATE usuarios SET
    nome = 'Pihetro Jefferson Diniz Pereira',
    email = 'pihetro.pereira@1b'
WHERE email = 'pietro.pereira@1b';

-- 12. Vinicius Inácio -> Vinícius Inacio
UPDATE usuarios SET
    nome = 'Vinícius Inacio Silva'
WHERE email = 'vinicius.silva@1b';

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2A - CORREÇÕES (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ronald Araujo -> Ronald Araújo (acento)
UPDATE usuarios SET
    nome = 'Ronald Araújo Oliveira'
WHERE email = 'ronald.oliveira@2a';

-- 2. Tainá -> Taina (sem acento)
UPDATE usuarios SET
    nome = 'Taina Ferreira de Moraes'
WHERE email = 'taina.morais@2a';

-- 3. Victor Emanuel -> Vitor Emanuel
UPDATE usuarios SET
    nome = 'Vitor Emanuel Neves Silva',
    email = 'vitor.silva@2a'
WHERE email = 'victor.silva@2a';

-- 4. Vitor Gabriel -> Vyctor Gabriel
UPDATE usuarios SET
    nome = 'Vyctor Gabriel Mendes Teles Lima',
    email = 'vyctor.lima@2a'
WHERE email = 'vitor.lima@2a';

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2B - CORREÇÕES (44 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- Nota: Kaiky Gabriel Sousa Araujo (T) - o (T) indica transferido?
-- Mantendo o nome como está, apenas removendo (T) se necessário

-- Nenhuma correção significativa identificada na turma 2B

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3A - CORREÇÕES (37 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ana Carolina Ferreira Balduíno -> Balduino (sem acento)
UPDATE usuarios SET
    nome = 'Ana Carolina Ferreira Balduino'
WHERE email = 'ana.balduino@3a';

-- 2. Eduardo Cabral Santos -> Eduardo Cabral Silva
UPDATE usuarios SET
    nome = 'Eduardo Cabral Silva'
WHERE email = 'eduardo.santos@3a';

-- 3. Emyle -> Emylly
UPDATE usuarios SET
    nome = 'Emylly Ayala Mendonça Batista',
    email = 'emylly.batista@3a'
WHERE email = 'emyle.batista@3a';

-- 4. Gabriela -> Gabriella
UPDATE usuarios SET
    nome = 'Gabriella Rodrigues Rocha',
    email = 'gabriella.rocha@3a'
WHERE email = 'gabriela.rocha@3a';

-- 5. Gabriely Vitória -> Gabriely Vitoria (sem acento)
UPDATE usuarios SET
    nome = 'Gabriely Vitoria dos Santos Ribeiro'
WHERE email = 'gabriely.ribeiro@3a';

-- 6. Helen -> Hellen
UPDATE usuarios SET
    nome = 'Hellen Maria Brito Sousa',
    email = 'hellen.sousa@3a'
WHERE email = 'helen.sousa@3a';

-- 7. Islaete da Conceição de Oliveira Dias -> Islaete da Conceição Lopes
UPDATE usuarios SET
    nome = 'Islaete da Conceição Lopes'
WHERE email = 'islaete.dias@3a';

-- 8. João Vitor Paiva Camargo -> João Vitor Paiva de Oliveira Dias
UPDATE usuarios SET
    nome = 'João Vitor Paiva de Oliveira Dias',
    email = 'joao.dias@3a'
WHERE email = 'joao.camargo@3a';

-- 9. Klerys da Silva Ferreira -> Klerys da Silva Camargo
UPDATE usuarios SET
    nome = 'Klerys da Silva Camargo'
WHERE email = 'klerys.ferreira@3a';

-- 10. Mayck Vinicius Custódio -> Mayck Vinicius Custodio (sem acento)
UPDATE usuarios SET
    nome = 'Mayck Vinicius Custodio Firmo'
WHERE email = 'mayck.firmo@3a';

-- 11. Raíla -> Railia
UPDATE usuarios SET
    nome = 'Railia Alves de Sousa',
    email = 'railia.sousa@3a'
WHERE email = 'raila.sousa@3a';

-- 12. Tálita -> Talita (sem acento)
UPDATE usuarios SET
    nome = 'Talita Santos de Sousa'
WHERE email = 'talita.sousa@3a';

-- 13. Vitor Tharlles -> Vitor Tharles
UPDATE usuarios SET
    nome = 'Vitor Tharles Barbosa da Silva'
WHERE email = 'vitor.silva@3a';

-- 14. Walisson -> Wallisson
UPDATE usuarios SET
    nome = 'Wallisson Richard Rosa Silva',
    email = 'wallisson.silva@3a'
WHERE email = 'walisson.silva@3a';

-- 15. Washington Luís -> Washington Luis (sem acento)
UPDATE usuarios SET
    nome = 'Washington Luis Gomes Junior'
WHERE email = 'washington.junior@3a';

-- 16. Widson -> Wdson
UPDATE usuarios SET
    nome = 'Wdson Henrique de Sousa Vieira',
    email = 'wdson.vieira@3a'
WHERE email = 'widson.vieira@3a';

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3B - CORREÇÕES (37 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ahudiel -> Ahdriel
UPDATE usuarios SET
    nome = 'Ahdriel Daniel da Silva Plácido',
    email = 'ahdriel.placido@3b'
WHERE email = 'ahudiel.placido@3b';

-- 2. Aliciane Correia da Silva Avila -> Aliciane Correia da Silva
UPDATE usuarios SET
    nome = 'Aliciane Correia da Silva'
WHERE email = 'aliciane.avila@3b';

-- 3. Ana Júlia -> Ana Julia (sem acento)
UPDATE usuarios SET
    nome = 'Ana Julia Rodrigues de Avila'
WHERE email = 'ana.avila@3b';

-- 4. Brenno Jonatha Frota Souza Santana -> Brenno Jonatah Souza Santana
UPDATE usuarios SET
    nome = 'Brenno Jonatah Souza Santana'
WHERE email = 'brenno.santana@3b';

-- 5. Cauã Souza Querino -> Cauã Souza Frota Querino
UPDATE usuarios SET
    nome = 'Cauã Souza Frota Querino dos Santos'
WHERE email = 'caua.santos@3b';

-- 6. Dionatha Gabriella de Sousa Ribeiro -> Dionatha Santos de Oliveira
UPDATE usuarios SET
    nome = 'Dionatha Santos de Oliveira',
    email = 'dionatha.oliveira@3b'
WHERE email = 'dionatha.ribeiro@3b';

-- 7. Emilly Santos de Oliveira -> Emilly Gabriella de Sousa Ribeiro
UPDATE usuarios SET
    nome = 'Emilly Gabriella de Sousa Ribeiro',
    email = 'emilly.ribeiro@3b'
WHERE email = 'emilly.oliveira@3b';

-- 8. Frederico Soares Colaço -> Colaco (sem cedilha)
UPDATE usuarios SET
    nome = 'Frederico Soares Colaco'
WHERE email = 'frederico.colaco@3b';

-- 9. Lara Vitória -> Lara Vitoria (sem acento)
UPDATE usuarios SET
    nome = 'Lara Vitoria Carneiro Ornelas'
WHERE email = 'lara.ornelas@3b';

-- 10. Laura Kellys -> Laura Keilms
UPDATE usuarios SET
    nome = 'Laura Keilms Alves de Souza'
WHERE email = 'laura.souza@3b';

-- 11. Micael Wesley -> Mickael Weslley
UPDATE usuarios SET
    nome = 'Mickael Weslley de Carvalho Lima',
    email = 'mickael.lima@3b'
WHERE email = 'micael.lima@3b';

-- 12. Murilo Tibúrcio -> Murylo Tiburcio
UPDATE usuarios SET
    nome = 'Murylo Tiburcio Vieira',
    email = 'murylo.vieira@3b'
WHERE email = 'murilo.vieira@3b';

-- 13. Paulo Henrique Araújo Barbosa -> Pedro Henrique Araújo Barbosa
UPDATE usuarios SET
    nome = 'Pedro Henrique Araújo Barbosa',
    email = 'pedro.barbosa@3b'
WHERE email = 'paulo.barbosa@3b';

-- 14. Talita -> Tallita
UPDATE usuarios SET
    nome = 'Tallita Alves Vieira',
    email = 'tallita.vieira@3b'
WHERE email = 'talita.vieira@3b';

-- 15. Terezinha Vittória -> Terezinha Vitória
UPDATE usuarios SET
    nome = 'Terezinha Vitória Araújo da Silva'
WHERE email = 'terezinha.silva@3b';

-- 16. Thomaz Dhavith Meirjan -> Thomaz Dhavih Merjan
UPDATE usuarios SET
    nome = 'Thomaz Dhavih Merjan Peres'
WHERE email = 'thomaz.peres@3b';

-- 17. Yasmin -> Yasmim
UPDATE usuarios SET
    nome = 'Yasmim Moraes Marques',
    email = 'yasmim.marques@3b'
WHERE email = 'yasmin.marques@3b';

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 3C - CORREÇÕES (29 alunos)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ana Flávia -> Ana Flavia (sem acento)
UPDATE usuarios SET
    nome = 'Ana Flavia Gonçalves da Cruz'
WHERE email = 'ana.cruz@3c';

-- 2. Ana Vitória -> Ana Vitoria (sem acento)
UPDATE usuarios SET
    nome = 'Ana Vitoria Abreu Martins'
WHERE email = 'ana.martins@3c';

-- Turma 3C parece estar correta no geral

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

-- Verificar total de estudantes por turma
SELECT
    turma,
    COUNT(*) as total_alunos
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'fisica' = ANY(componentes)
  AND tipo = 'estudante'
GROUP BY turma
ORDER BY turma;

-- Listar todos os estudantes para conferência
SELECT
    turma,
    email,
    nome
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'fisica' = ANY(componentes)
  AND tipo = 'estudante'
ORDER BY turma, nome;
