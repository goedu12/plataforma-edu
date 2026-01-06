#!/usr/bin/env python3
"""
📥 IMPORTAR QUESTÕES ENEM (CSV) NO SUPABASE
============================================
Script para importar CSV do HuggingFace para a tabela questoes_enem do Studão

Formatos suportados:
1. Formato processado: colunas A, B, C, D, E separadas
2. Formato original HuggingFace: coluna 'alternatives' com lista

Colunas esperadas:
- id, exam, question, description
- A, B, C, D, E (ou alternatives)
- label (resposta correta: A, B, C, D ou E)
- figures (URLs das imagens)
- IU, ledor (opcionais - acessibilidade)
- area (opcional)

Uso:
    1. Configure SUPABASE_URL e SUPABASE_SERVICE_KEY
    2. Coloque o arquivo CSV na pasta scripts/
    3. Execute: python3 importar_csv_enem.py
"""

import csv
import os
import sys
import json
import re
import ast

try:
    from supabase import create_client
except ImportError:
    print("❌ Instale o supabase: pip install supabase")
    sys.exit(1)

# ============================================
# CONFIGURAÇÃO
# ============================================

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Arquivos CSV disponíveis
ARQUIVOS_CSV = [
    "enem_ciencias_natureza.csv",
    "enem_matematica.csv",
    "enem_completo.csv",
]

TABELA = "questoes_enem"

# ============================================
# MAPEAMENTO DE CAMPOS
# ============================================

def mapear_area(area_original: str) -> tuple:
    """Mapeia área do CSV para nossa estrutura (area, subarea)"""
    area = area_original.lower().strip() if area_original else ""

    # Ciências da Natureza
    if "natureza" in area or "ciências" in area or "natural" in area:
        return "ciencias-natureza", "fisica"
    if "física" in area or "fisica" in area:
        return "ciencias-natureza", "fisica"
    if "química" in area or "quimica" in area:
        return "ciencias-natureza", "quimica"
    if "biologia" in area:
        return "ciencias-natureza", "biologia"

    # Matemática
    if "matemática" in area or "matematica" in area:
        return "matematica", "matematica"

    # Linguagens
    if "linguagens" in area or "português" in area or "literatura" in area:
        return "linguagens", "portugues"

    # Ciências Humanas
    if "humanas" in area or "história" in area or "geografia" in area:
        return "ciencias-humanas", "historia"

    # Default para Ciências da Natureza
    return "ciencias-natureza", "fisica"


def extrair_imagem(figures: str) -> tuple:
    """Extrai URLs de imagens do campo figures"""
    if not figures or figures.strip() in ['', '[]', 'nan', 'None', 'NaN']:
        return None, []

    try:
        # Tentar parsear como JSON/lista Python
        if figures.startswith('['):
            # Tentar como JSON primeiro
            try:
                urls = json.loads(figures)
            except:
                # Tentar como lista Python (com aspas simples)
                urls = ast.literal_eval(figures)

            if urls and len(urls) > 0:
                return urls[0], urls[1:] if len(urls) > 1 else []
        # Se for uma URL única
        elif figures.startswith('http'):
            return figures.strip(), []
    except:
        pass

    return None, []


def extrair_alternativas(row: dict) -> dict:
    """Extrai alternativas A-E do CSV (formato separado ou lista)"""

    # Formato 1: Colunas separadas (A, B, C, D, E)
    if 'A' in row and 'B' in row:
        return {
            'a': row.get('A', ''),
            'b': row.get('B', ''),
            'c': row.get('C', ''),
            'd': row.get('D', ''),
            'e': row.get('E', ''),
        }

    # Formato 2: Coluna 'alternatives' com lista
    alternatives = row.get('alternatives', '')
    if not alternatives or alternatives in ['', '[]', 'nan', 'None', 'NaN']:
        return {'a': '', 'b': '', 'c': '', 'd': '', 'e': ''}

    try:
        # Tentar parsear como lista Python
        if alternatives.startswith('['):
            try:
                alts = json.loads(alternatives)
            except:
                alts = ast.literal_eval(alternatives)

            return {
                'a': alts[0] if len(alts) > 0 else '',
                'b': alts[1] if len(alts) > 1 else '',
                'c': alts[2] if len(alts) > 2 else '',
                'd': alts[3] if len(alts) > 3 else '',
                'e': alts[4] if len(alts) > 4 else '',
            }
    except Exception as e:
        print(f"   ⚠️ Erro ao parsear alternativas: {e}")

    return {'a': '', 'b': '', 'c': '', 'd': '', 'e': ''}


def converter_questao_csv(row: dict, index: int) -> dict:
    """Converte uma linha do CSV para o formato da tabela questoes_enem"""

    # Extrair ano da prova (campo 'exam' ou 'ano')
    ano = 2020
    try:
        exam = row.get('exam', '') or row.get('ano', '')
        if exam:
            ano = int(float(exam))  # float() para lidar com "2022.0"
    except:
        pass

    # ID único
    id_original = row.get('id', f'csv-{index}')

    # Área e subárea (tentar detectar do campo 'area' ou do conteúdo)
    area_csv = row.get('area', '')
    area, subarea = mapear_area(area_csv)

    # Número da questão (tentar extrair do id ou usar índice)
    numero = index + 1
    try:
        # IDs costumam ter formato como "questao_01", "2020_Q01", etc.
        id_str = str(id_original)
        # Extrair números do final
        numeros = re.findall(r'\d+', id_str)
        if numeros:
            # Usar o último número encontrado
            numero = int(numeros[-1])
    except:
        pass

    # Imagens
    imagem_principal, imagens_extras = extrair_imagem(row.get('figures', ''))

    # Alternativas (suporta ambos os formatos)
    alts = extrair_alternativas(row)

    # Dificuldade baseada no level (se existir)
    dificuldade = 'medio'
    try:
        level = row.get('level', '')
        if level and level not in ['', 'nan', 'None', 'NaN']:
            level_int = int(float(level))
            if level_int <= 1:
                dificuldade = 'facil'
            elif level_int >= 4:
                dificuldade = 'dificil'
    except:
        pass

    # Resposta correta
    resposta = str(row.get('label', 'A')).upper().strip()
    if resposta not in ['A', 'B', 'C', 'D', 'E']:
        resposta = 'A'

    # Enunciado (question é o principal, description é acessibilidade)
    enunciado = row.get('question', '') or ''
    descricao = row.get('description', '')

    # Limpar valores NaN
    if enunciado in ['nan', 'None', 'NaN']:
        enunciado = ''
    if descricao in ['nan', 'None', 'NaN']:
        descricao = None

    return {
        "id_api": f"csv-{ano}-{numero}-{id_original}",
        "ano_prova": ano,
        "numero_questao": numero,
        "area": area,
        "subarea": subarea,
        "titulo": f"ENEM {ano} - Questão {numero}",
        "contexto": enunciado,
        "comando": descricao if descricao else None,
        "imagem_principal": imagem_principal,
        "imagens_extras": imagens_extras if imagens_extras else None,
        "alternativa_a": alts['a'],
        "alternativa_b": alts['b'],
        "alternativa_c": alts['c'],
        "alternativa_d": alts['d'],
        "alternativa_e": alts['e'],
        "resposta_correta": resposta,
        "conteudo_principal": None,
        "dificuldade": dificuldade,
        "fonte": "ENEM-CSV",
        "status": "ativa",
    }


def main():
    print("=" * 60)
    print("📥 IMPORTAÇÃO DE QUESTÕES ENEM (CSV) → SUPABASE")
    print("=" * 60)

    # Verificar configuração
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Configure as variáveis de ambiente:")
        print("   export SUPABASE_URL='sua-url'")
        print("   export SUPABASE_SERVICE_KEY='sua-service-key'")
        print("\n💡 Dica: Você encontra essas informações em:")
        print("   Supabase Dashboard → Settings → API")
        return

    # Conectar ao Supabase
    print("\n🔌 Conectando ao Supabase...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("   ✅ Conectado!")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
        return

    # Buscar arquivo CSV
    print("\n📂 Buscando arquivos CSV...")

    # Verificar na pasta atual e na pasta scripts
    caminhos_possiveis = ['.', 'scripts', '..']
    arquivo_encontrado = None

    for caminho in caminhos_possiveis:
        for arquivo in ARQUIVOS_CSV:
            path_completo = os.path.join(caminho, arquivo)
            if os.path.exists(path_completo):
                arquivo_encontrado = path_completo
                break
        if arquivo_encontrado:
            break

    # Também verificar qualquer CSV na pasta
    if not arquivo_encontrado:
        for caminho in caminhos_possiveis:
            if os.path.exists(caminho):
                for f in os.listdir(caminho):
                    if f.endswith('.csv') and 'enem' in f.lower():
                        arquivo_encontrado = os.path.join(caminho, f)
                        break
            if arquivo_encontrado:
                break

    if not arquivo_encontrado:
        print("\n❌ Nenhum arquivo CSV encontrado!")
        print("   Arquivos esperados:")
        for a in ARQUIVOS_CSV:
            print(f"     - {a}")
        print("\n   Ou qualquer arquivo .csv com 'enem' no nome.")
        return

    print(f"   ✅ Encontrado: {arquivo_encontrado}")

    # Carregar CSV
    print(f"\n📂 Carregando {arquivo_encontrado}...")
    questoes = []

    try:
        with open(arquivo_encontrado, 'r', encoding='utf-8') as f:
            # Detectar delimitador
            sample = f.read(2048)
            f.seek(0)

            if '\t' in sample:
                delimiter = '\t'
            elif ';' in sample:
                delimiter = ';'
            else:
                delimiter = ','

            reader = csv.DictReader(f, delimiter=delimiter)
            questoes = list(reader)

        print(f"   ✅ {len(questoes)} questões carregadas")

        # Mostrar colunas detectadas
        if questoes:
            print(f"   📋 Colunas: {', '.join(questoes[0].keys())}")

    except Exception as e:
        print(f"   ❌ Erro ao carregar: {e}")
        return

    if not questoes:
        print("\n❌ CSV está vazio!")
        return

    # Preview
    print("\n📋 Preview da primeira questão:")
    print("-" * 50)
    q = questoes[0]
    for k, v in list(q.items())[:8]:
        valor = str(v)[:60] + "..." if len(str(v)) > 60 else str(v)
        print(f"   {k}: {valor}")
    print("-" * 50)

    # Verificar colunas obrigatórias
    colunas = questoes[0].keys()
    tem_alternativas_separadas = 'A' in colunas and 'B' in colunas
    tem_alternativas_lista = 'alternatives' in colunas
    tem_label = 'label' in colunas
    tem_question = 'question' in colunas

    if not tem_label:
        print("\n⚠️ Coluna 'label' (resposta correta) não encontrada!")
        print("   Colunas disponíveis:", ', '.join(colunas))
        return

    if not tem_alternativas_separadas and not tem_alternativas_lista:
        print("\n⚠️ Alternativas não encontradas!")
        print("   Esperado: colunas A, B, C, D, E ou coluna 'alternatives' com lista")
        print("   Colunas disponíveis:", ', '.join(colunas))
        return

    if tem_alternativas_separadas:
        print("   📋 Formato detectado: Alternativas em colunas separadas (A, B, C, D, E)")
    else:
        print("   📋 Formato detectado: Alternativas em coluna 'alternatives' (lista)")

    # Verificar modo automático
    auto_mode = '--auto' in sys.argv or '-y' in sys.argv

    # Confirmar
    if auto_mode:
        print(f"\n🤖 Modo automático: Importando {len(questoes)} questões...")
    else:
        resposta = input(f"\n❓ Importar {len(questoes)} questões? (s/n): ")
        if resposta.lower() != 's':
            print("Importação cancelada.")
            return

    # Importar questões
    print(f"\n📤 Importando para tabela '{TABELA}'...")

    sucesso = 0
    erros = 0
    erros_lista = []

    # Contar questões por ano para relatório
    questoes_por_ano = {}

    for i, row in enumerate(questoes):
        try:
            # Converter para formato do banco
            questao_convertida = converter_questao_csv(row, i)

            # Validar que tem conteúdo mínimo
            if not questao_convertida['contexto'] and not questao_convertida['comando']:
                erros += 1
                erros_lista.append(f"Questão {i}: Sem enunciado")
                continue

            if not questao_convertida['alternativa_a']:
                erros += 1
                erros_lista.append(f"Questão {i}: Sem alternativa A")
                continue

            # Inserir no Supabase (upsert para evitar duplicatas por id_api)
            result = supabase.table(TABELA).upsert(
                questao_convertida,
                on_conflict="id_api"
            ).execute()

            sucesso += 1

            # Contar por ano
            ano = questao_convertida['ano_prova']
            questoes_por_ano[ano] = questoes_por_ano.get(ano, 0) + 1

            # Progresso a cada 50 questões
            if (i + 1) % 50 == 0:
                print(f"   📊 Progresso: {i + 1}/{len(questoes)} ({sucesso} ok, {erros} erros)")

        except Exception as e:
            erros += 1
            erro_str = str(e)

            # Detectar erros de duplicata (constraint unique)
            if 'duplicate key' in erro_str.lower() or 'unique constraint' in erro_str.lower():
                erros_lista.append(f"Questão {i}: Duplicada (já existe no banco)")
            else:
                erros_lista.append(f"Questão {i}: {erro_str[:80]}")

            if erros <= 5:
                print(f"   ⚠️ Erro na questão {i}: {erro_str[:100]}")

    # Resultado
    print("\n" + "=" * 60)
    print("📊 RESULTADO DA IMPORTAÇÃO")
    print("=" * 60)
    print(f"   ✅ Sucesso: {sucesso}")
    print(f"   ❌ Erros: {erros}")
    print(f"   📝 Total processado: {len(questoes)}")

    # Mostrar por ano
    if questoes_por_ano:
        print("\n📅 Questões importadas por ano:")
        for ano in sorted(questoes_por_ano.keys(), reverse=True):
            print(f"   {ano}: {questoes_por_ano[ano]} questões")

    if erros == 0:
        print("\n🎉 Importação concluída com sucesso!")
    else:
        print("\n⚠️ Importação concluída com alguns erros.")
        if erros_lista:
            print("\nPrimeiros erros:")
            for e in erros_lista[:5]:
                print(f"   - {e}")

    # Verificar total no banco
    try:
        result = supabase.table(TABELA).select("id", count="exact").execute()
        print(f"\n📊 Total de questões no banco: {result.count}")
    except:
        pass

    print("\n✅ Pronto! As questões já estão disponíveis no Simulado ENEM.")
    print("   Acesse: /fisica/simulado-enem ou /matematica/simulado-enem")


if __name__ == "__main__":
    main()
