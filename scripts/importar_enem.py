#!/usr/bin/env python3
"""
📥 IMPORTAR QUESTÕES ENEM NO SUPABASE
=====================================
Script adaptado para a estrutura da tabela questoes_enem do Studão

Uso:
    1. Configure SUPABASE_URL e SUPABASE_SERVICE_KEY
    2. Coloque o arquivo JSON na mesma pasta
    3. Execute: python3 importar_enem.py
"""

import json
import os
import sys
from datetime import datetime

try:
    from supabase import create_client
except ImportError:
    print("❌ Instale o supabase: pip install supabase")
    sys.exit(1)

# ============================================
# CONFIGURAÇÃO
# ============================================

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")  # Use a SERVICE KEY (não a anon key)

# Arquivos disponíveis
ARQUIVOS_JSON = [
    "enem_supabase_completo.json",
    "enem_ciencias_natureza.json",
]

TABELA = "questoes_enem"

# ============================================
# MAPEAMENTO DE CAMPOS
# ============================================

def mapear_area(area_original: str) -> tuple[str, str]:
    """Mapeia área do JSON para nossa estrutura (area, subarea)"""
    area = area_original.lower().strip() if area_original else ""

    # Ciências da Natureza
    if "natureza" in area or "ciências" in area:
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

    # Default
    return "ciencias-natureza", "fisica"


def converter_questao(q: dict) -> dict:
    """Converte questão do formato antigo para o novo"""

    area, subarea = mapear_area(q.get("area", ""))

    # ID único baseado em ano e número
    ano = q.get("ano", 2020)
    numero = q.get("numero", 0)
    id_original = q.get("id_original", f"{ano}-{numero}")

    return {
        "id_api": f"csv-{ano}-{numero}-{id_original}",
        "ano_prova": ano,
        "numero_questao": numero,
        "area": area,
        "subarea": subarea,
        "titulo": f"ENEM {ano} - Questão {numero}",
        "contexto": q.get("enunciado", ""),
        "comando": q.get("descricao_imagem", None),
        "imagem_principal": q.get("imagem_url", None),
        "alternativa_a": q.get("alternativa_a", ""),
        "alternativa_b": q.get("alternativa_b", ""),
        "alternativa_c": q.get("alternativa_c", ""),
        "alternativa_d": q.get("alternativa_d", ""),
        "alternativa_e": q.get("alternativa_e", ""),
        "resposta_correta": q.get("correta", "A").upper(),
        "conteudo_principal": q.get("tema_especifico", None),
        "dificuldade": q.get("dificuldade", "medio"),
        "fonte": q.get("fonte", "ENEM-CSV"),
        "status": "ativa",
    }


def main():
    print("=" * 60)
    print("📥 IMPORTAÇÃO DE QUESTÕES ENEM → SUPABASE")
    print("=" * 60)

    # Verificar configuração
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Configure as variáveis de ambiente:")
        print("   export SUPABASE_URL='sua-url'")
        print("   export SUPABASE_SERVICE_KEY='sua-service-key'")
        return

    # Conectar ao Supabase
    print("\n🔌 Conectando ao Supabase...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("   ✅ Conectado!")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
        return

    # Escolher arquivo
    print("\n📂 Arquivos disponíveis:")
    for i, arquivo in enumerate(ARQUIVOS_JSON):
        existe = "✅" if os.path.exists(arquivo) else "❌"
        print(f"   {i + 1}. {arquivo} {existe}")

    arquivo_escolhido = None
    for arquivo in ARQUIVOS_JSON:
        if os.path.exists(arquivo):
            arquivo_escolhido = arquivo
            break

    if not arquivo_escolhido:
        print("\n❌ Nenhum arquivo JSON encontrado!")
        print("   Coloque o arquivo na mesma pasta do script.")
        return

    # Carregar JSON
    print(f"\n📂 Carregando {arquivo_escolhido}...")
    try:
        with open(arquivo_escolhido, 'r', encoding='utf-8') as f:
            questoes = json.load(f)
        print(f"   ✅ {len(questoes)} questões carregadas")
    except Exception as e:
        print(f"   ❌ Erro ao carregar: {e}")
        return

    # Mostrar preview
    if questoes:
        print("\n📋 Preview da primeira questão:")
        print("-" * 40)
        q = questoes[0]
        for k, v in list(q.items())[:5]:
            print(f"   {k}: {str(v)[:50]}...")
        print("-" * 40)

    # Confirmar
    resposta = input(f"\n❓ Importar {len(questoes)} questões? (s/n): ")
    if resposta.lower() != 's':
        print("Importação cancelada.")
        return

    # Importar questões
    print(f"\n📤 Importando para tabela '{TABELA}'...")

    sucesso = 0
    erros = 0
    erros_lista = []

    for i, q in enumerate(questoes):
        try:
            # Converter para novo formato
            questao_convertida = converter_questao(q)

            # Inserir no Supabase (upsert para evitar duplicatas)
            supabase.table(TABELA).upsert(
                questao_convertida,
                on_conflict="id_api"
            ).execute()

            sucesso += 1

            # Progresso a cada 20 questões
            if (i + 1) % 20 == 0:
                print(f"   📊 Progresso: {i + 1}/{len(questoes)} ({sucesso} ok, {erros} erros)")

        except Exception as e:
            erros += 1
            erros_lista.append(f"Questão {i}: {str(e)[:100]}")
            if erros <= 5:
                print(f"   ⚠️ Erro na questão {i}: {e}")

    # Resultado
    print("\n" + "=" * 60)
    print("📊 RESULTADO DA IMPORTAÇÃO")
    print("=" * 60)
    print(f"   ✅ Sucesso: {sucesso}")
    print(f"   ❌ Erros: {erros}")
    print(f"   📝 Total: {len(questoes)}")

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


if __name__ == "__main__":
    main()
