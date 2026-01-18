#!/usr/bin/env python3
"""
Gerador simplificado de questões usando API REST do Gemini
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import ssl

# Configurações
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Desabilitar verificação SSL (para ambiente de desenvolvimento)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Currículo de Física
CURRICULO = {
    "1EM": {
        1: {"tema": "Cinemática", "subtema": "Conceitos de movimento, referencial, velocidade média"},
        2: {"tema": "Cinemática", "subtema": "MRU - Movimento Retilíneo Uniforme"},
        3: {"tema": "Cinemática", "subtema": "MRUV - Movimento com aceleração"},
    },
    "2EM": {
        1: {"tema": "Termologia", "subtema": "Temperatura, escalas termométricas, equilíbrio térmico"},
        2: {"tema": "Termologia", "subtema": "Calor sensível e latente"},
        3: {"tema": "Termologia", "subtema": "Propagação de calor"},
    },
    "3EM": {
        1: {"tema": "Eletrostática", "subtema": "Cargas elétricas, eletrização"},
        2: {"tema": "Eletrostática", "subtema": "Lei de Coulomb, campo elétrico"},
        3: {"tema": "Eletrodinâmica", "subtema": "Corrente elétrica, resistência"},
    }
}

PROMPT_TEMPLATE = """
Você é um professor de Física especialista em criar questões para estudantes do Ensino Médio de escolas públicas brasileiras.

Crie 5 questões de Física sobre o tema "{tema}" - "{subtema}" para a {serie} série do Ensino Médio.

REGRAS OBRIGATÓRIAS:
1. Use contextos do cotidiano de estudantes brasileiros de escola pública (ônibus escolar, conta de luz, celular carregando, etc)
2. Cada questão deve ter 5 alternativas (A, B, C, D, E)
3. As alternativas erradas devem ser PLAUSÍVEIS (baseadas em erros comuns dos alunos)
4. Inclua uma DICA que ajude sem revelar a resposta
5. Inclua um FEEDBACK explicativo para quando o aluno responder

TIPOS DE QUESTÃO (varie entre eles):
- conceitual: Compreensão sem cálculos
- calculo_direto: Aplicação de fórmula
- situacao_problema: Problema contextualizado
- analise_fenomeno: Explicar por que algo acontece
- comparacao: Comparar situações ou grandezas

Retorne APENAS um JSON válido no formato:
{{
  "questoes": [
    {{
      "tipo_questao": "conceitual",
      "contexto": "Cotidiano - Transporte",
      "enunciado": "Um ônibus escolar...",
      "alternativas": {{"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}},
      "resposta_correta": "A",
      "dica": "Lembre-se que...",
      "feedback": "A resposta correta é A porque..."
    }}
  ]
}}
"""

def chamar_gemini(prompt):
    """Chama a API do Gemini via REST"""
    # Tenta diferentes modelos e versões da API
    tentativas = [
        ("v1", "gemini-pro"),
        ("v1beta", "gemini-pro"),
        ("v1", "gemini-1.0-pro"),
    ]

    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.8,
            "topP": 0.95,
            "maxOutputTokens": 8192
        }
    }

    for api_version, model in tentativas:
        url = f"https://generativelanguage.googleapis.com/{api_version}/models/{model}:generateContent?key={GEMINI_API_KEY}"
        print(f"  Tentando: {api_version}/{model}")

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=120, context=ssl_context) as response:
                result = json.loads(response.read().decode('utf-8'))
                text = result['candidates'][0]['content']['parts'][0]['text']
                # Limpar markdown se presente
                if text.startswith('```'):
                    text = text.split('```')[1]
                    if text.startswith('json'):
                        text = text[4:]
                print(f"  ✅ Sucesso com {model}!")
                return text.strip()
        except urllib.error.HTTPError as e:
            error_msg = e.read().decode()[:200]
            print(f"  ❌ {e.code}: {error_msg}")
            continue
        except Exception as e:
            print(f"  ❌ Erro: {e}")
            continue

    return None

def salvar_no_supabase(questoes, serie, semana, tema, subtema):
    """Salva questões no Supabase via REST"""
    url = f"{SUPABASE_URL}/rest/v1/questoes_trilha"

    for i, q in enumerate(questoes, 1):
        questao_id = f"auto-{serie.lower()}-s{semana}-q{i}-{int(time.time())}"

        data = {
            "id": questao_id,
            "trilha_id": "passar_ano",
            "serie": serie,
            "semana": semana,
            "ordem": i,
            "tema": tema,
            "subtema": subtema,
            "tipo_questao": q.get("tipo_questao", "conceitual"),
            "dificuldade": "medio",
            "contexto": q.get("contexto", ""),
            "enunciado": q["enunciado"],
            "alternativas": q["alternativas"],
            "resposta_correta": q["resposta_correta"],
            "dica": q.get("dica", ""),
            "feedback": q.get("feedback", "")
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Prefer': 'return=minimal'
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=30, context=ssl_context) as response:
                print(f"  ✅ Questão {i} salva: {questao_id}")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"  ❌ Erro ao salvar questão {i}: {e.code} - {error_body}")
        except Exception as e:
            print(f"  ❌ Erro ao salvar questão {i}: {e}")

def main():
    if not GEMINI_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Configure as variáveis de ambiente:")
        print("   GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY")
        sys.exit(1)

    # Pegar argumentos
    serie = sys.argv[1] if len(sys.argv) > 1 else "1EM"
    semana = int(sys.argv[2]) if len(sys.argv) > 2 else 1

    if serie not in CURRICULO:
        print(f"❌ Série inválida: {serie}. Use: 1EM, 2EM ou 3EM")
        sys.exit(1)

    if semana not in CURRICULO[serie]:
        print(f"❌ Semana {semana} não configurada para {serie}")
        print(f"   Semanas disponíveis: {list(CURRICULO[serie].keys())}")
        sys.exit(1)

    conteudo = CURRICULO[serie][semana]
    tema = conteudo["tema"]
    subtema = conteudo["subtema"]

    print(f"\n🚀 Gerando questões para {serie} - Semana {semana}")
    print(f"📚 Tema: {tema} - {subtema}\n")

    # Gerar prompt
    prompt = PROMPT_TEMPLATE.format(
        serie=serie[0],
        tema=tema,
        subtema=subtema
    )

    print("🤖 Chamando Gemini...")
    resposta = chamar_gemini(prompt)

    if not resposta:
        print("❌ Falha ao gerar questões")
        sys.exit(1)

    try:
        dados = json.loads(resposta)
        questoes = dados.get("questoes", [])
        print(f"✅ {len(questoes)} questões geradas\n")
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao parsear JSON: {e}")
        print(f"Resposta: {resposta[:500]}...")
        sys.exit(1)

    print("💾 Salvando no Supabase...")
    salvar_no_supabase(questoes, serie, semana, tema, subtema)

    print(f"\n✅ Concluído! {len(questoes)} questões salvas para {serie} semana {semana}")

if __name__ == "__main__":
    main()
