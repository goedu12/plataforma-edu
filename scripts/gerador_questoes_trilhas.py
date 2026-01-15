#!/usr/bin/env python3
"""
================================================================================
🚀 GERADOR DE QUESTÕES PARA SISTEMA DE TRILHAS
================================================================================

Gera questões de Física organizadas por semana para o sistema de trilhas.

Características:
- 6 tipos de questão (conceitual, cálculo, gráfico, problema, fenômeno, comparação)
- Contextos do cotidiano de escola pública brasileira
- 5 alternativas plausíveis (baseadas em erros comuns)
- Dica pedagógica (sem revelar resposta)
- Feedback completo (explicação + erros comuns + curiosidade)
- Embeddings para busca semântica (RAG)

PONTO DE RESTAURAÇÃO: tag v1.0-pre-trilhas
Para voltar: git checkout v1.0-pre-trilhas

Uso:
    python gerador_questoes_trilhas.py                    # Gerar tudo
    python gerador_questoes_trilhas.py --serie 1EM       # Só 1º ano
    python gerador_questoes_trilhas.py --semana 5        # Semana específica
    python gerador_questoes_trilhas.py --serie 2EM --semana 10  # Combinado

Configuração:
    Defina as variáveis de ambiente ou edite as constantes abaixo:
    - GEMINI_API_KEY
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY

================================================================================
"""

import os
import sys
import json
import time
import random
import argparse
from datetime import datetime
from typing import Optional, Dict, List, Any

# Tentar importar dependências
try:
    import google.generativeai as genai
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Erro: Dependência não encontrada: {e}")
    print("\n📦 Instale as dependências:")
    print("   pip install google-generativeai supabase")
    sys.exit(1)

# ============================================================================
# ⚙️ CONFIGURAÇÕES
# ============================================================================

# API Keys (use variáveis de ambiente em produção)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "SUA_GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://seu-projeto.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "sua_service_key")

# Configurações de geração
ANO_LETIVO = int(os.getenv("ANO_LETIVO", datetime.now().year))
DELAY_ENTRE_CHAMADAS = 4  # Segundos (evitar rate limit)
QUESTOES_POR_SEMANA = 6   # 5 normais + 1 desafio

# Arquivos de controle
ARQUIVO_PROGRESSO = "progresso_geracao.json"
ARQUIVO_BACKUP = "backup_questoes.json"

# ============================================================================
# 📚 TIPOS DE QUESTÃO
# ============================================================================

TIPOS_QUESTAO = {
    "conceitual": {
        "descricao": "Compreensão de conceitos sem cálculos",
        "exemplo": "Por que a água do café esfria mais rápido quando sopramos?",
        "peso": 20
    },
    "calculo_direto": {
        "descricao": "Aplicação direta de uma fórmula",
        "exemplo": "Calcule a velocidade média de um ônibus...",
        "peso": 25
    },
    "interpretacao_grafico": {
        "descricao": "Análise de gráficos e tabelas",
        "exemplo": "O gráfico mostra a posição de um ciclista...",
        "peso": 15
    },
    "situacao_problema": {
        "descricao": "Problema contextualizado com múltiplos passos",
        "exemplo": "Maria precisa calcular quanto gastará de energia...",
        "peso": 20
    },
    "analise_fenomeno": {
        "descricao": "Explicar por que algo acontece",
        "exemplo": "Por que sentimos mais frio ao sair molhados do banho?",
        "peso": 10
    },
    "comparacao": {
        "descricao": "Comparar situações físicas",
        "exemplo": "Em qual situação a bola chegará primeiro ao chão?",
        "peso": 10
    }
}

# ============================================================================
# 🏠 CONTEXTOS DO COTIDIANO
# ============================================================================

CONTEXTOS = {
    "transporte": [
        "Ônibus lotado freando bruscamente",
        "Bicicleta subindo ladeira no bairro",
        "Moto acelerando no semáforo",
        "Van escolar fazendo curva",
        "Skate descendo rampa na praça",
        "Patinete na ciclovia"
    ],
    "casa_familia": [
        "Panela de pressão da mãe",
        "Geladeira velha gastando muita luz",
        "Chuveiro elétrico no inverno",
        "Ventilador de teto",
        "Ferro de passar roupa",
        "Liquidificador batendo vitamina",
        "Micro-ondas esquentando marmita",
        "Conta de luz no fim do mês"
    ],
    "escola": [
        "Quadra de esportes - bola de vôlei",
        "Escada do prédio",
        "Bebedouro com água gelada",
        "Eco no corredor vazio",
        "Sombra no pátio ao meio-dia",
        "Sino da escola",
        "Projetor da sala de aula"
    ],
    "rua_bairro": [
        "Poste de luz à noite",
        "Caixa d'água no alto do morro",
        "Fio de alta tensão",
        "Bueiro transbordando na chuva",
        "Pipa no céu",
        "Som alto do vizinho",
        "Raio e trovão na tempestade"
    ],
    "corpo_saude": [
        "Febre medida com termômetro",
        "Óculos de grau",
        "Fone de ouvido alto",
        "Suor esfriando o corpo",
        "Pressão arterial",
        "Raio-X no posto de saúde"
    ],
    "lazer_tecnologia": [
        "Celular carregando",
        "Alto-falante da caixa de som",
        "Piscina pública",
        "Pular de trampolim",
        "Selfie com flash",
        "Jogo no celular esquentando"
    ],
    "trabalho_profissoes": [
        "Pedreiro carregando peso na obra",
        "Eletricista trocando fiação",
        "Mecânico usando macaco hidráulico",
        "Entregador de gás subindo escada",
        "Feirante usando balança"
    ]
}

# ============================================================================
# 📅 CRONOGRAMA SEMANAL (40 SEMANAS x 3 SÉRIES)
# ============================================================================

CRONOGRAMA = {
    "1EM": {
        # BIMESTRE 1: CINEMÁTICA (Semanas 1-10)
        1: ("cinematica", "Referencial, trajetória e posição", "transporte"),
        2: ("cinematica", "Velocidade média e instantânea", "transporte"),
        3: ("cinematica", "Movimento Retilíneo Uniforme (MRU)", "transporte"),
        4: ("cinematica", "Gráficos do MRU", "transporte"),
        5: ("cinematica", "Aceleração média e instantânea", "transporte"),
        6: ("cinematica", "Movimento Retilíneo Uniformemente Variado (MRUV)", "transporte"),
        7: ("cinematica", "Equações do MRUV", "transporte"),
        8: ("cinematica", "Queda livre", "escola"),
        9: ("cinematica", "Lançamento vertical", "escola"),
        10: ("cinematica", "Revisão de Cinemática", "transporte"),
        # BIMESTRE 2: DINÂMICA (Semanas 11-20)
        11: ("dinamica", "Conceito de força e tipos de forças", "casa_familia"),
        12: ("dinamica", "Primeira Lei de Newton - Inércia", "transporte"),
        13: ("dinamica", "Segunda Lei de Newton - F=ma", "transporte"),
        14: ("dinamica", "Terceira Lei de Newton - Ação e Reação", "escola"),
        15: ("dinamica", "Força peso e força normal", "corpo_saude"),
        16: ("dinamica", "Força de atrito estático e cinético", "transporte"),
        17: ("dinamica", "Plano inclinado", "rua_bairro"),
        18: ("dinamica", "Força elástica e Lei de Hooke", "lazer_tecnologia"),
        19: ("dinamica", "Aplicações das Leis de Newton", "trabalho_profissoes"),
        20: ("dinamica", "Revisão de Dinâmica", "transporte"),
        # BIMESTRE 3: ENERGIA (Semanas 21-30)
        21: ("energia", "Trabalho de uma força constante", "trabalho_profissoes"),
        22: ("energia", "Energia cinética", "transporte"),
        23: ("energia", "Teorema trabalho-energia cinética", "escola"),
        24: ("energia", "Energia potencial gravitacional", "rua_bairro"),
        25: ("energia", "Energia potencial elástica", "lazer_tecnologia"),
        26: ("energia", "Conservação da energia mecânica", "escola"),
        27: ("energia", "Potência média e instantânea", "casa_familia"),
        28: ("momento", "Quantidade de movimento e impulso", "escola"),
        29: ("momento", "Colisões elásticas e inelásticas", "transporte"),
        30: ("energia", "Revisão de Energia e Momento", "casa_familia"),
        # BIMESTRE 4: GRAVITAÇÃO E ESTÁTICA (Semanas 31-40)
        31: ("gravitacao", "Lei da Gravitação Universal", "lazer_tecnologia"),
        32: ("gravitacao", "Campo gravitacional e aceleração da gravidade", "lazer_tecnologia"),
        33: ("gravitacao", "Leis de Kepler", "lazer_tecnologia"),
        34: ("estatica", "Equilíbrio de um ponto material", "trabalho_profissoes"),
        35: ("estatica", "Momento de uma força (torque)", "trabalho_profissoes"),
        36: ("hidrostatica", "Pressão e suas unidades", "corpo_saude"),
        37: ("hidrostatica", "Pressão em fluidos - Lei de Stevin", "rua_bairro"),
        38: ("hidrostatica", "Empuxo e Princípio de Arquimedes", "lazer_tecnologia"),
        39: ("hidrostatica", "Aplicações de hidrostática", "casa_familia"),
        40: ("revisao", "Revisão geral do ano", "todos"),
    },
    "2EM": {
        # BIMESTRE 1: TERMOLOGIA (Semanas 1-10)
        1: ("termologia", "Temperatura e escalas termométricas", "corpo_saude"),
        2: ("termologia", "Conversão entre escalas (Celsius, Fahrenheit, Kelvin)", "corpo_saude"),
        3: ("termologia", "Equilíbrio térmico", "casa_familia"),
        4: ("termologia", "Dilatação linear e superficial", "rua_bairro"),
        5: ("termologia", "Dilatação volumétrica", "casa_familia"),
        6: ("calorimetria", "Calor e energia térmica", "casa_familia"),
        7: ("calorimetria", "Calor sensível e capacidade térmica", "casa_familia"),
        8: ("calorimetria", "Trocas de calor", "casa_familia"),
        9: ("calorimetria", "Calor latente e mudanças de estado", "casa_familia"),
        10: ("termologia", "Revisão de Termologia", "casa_familia"),
        # BIMESTRE 2: TERMODINÂMICA (Semanas 11-20)
        11: ("transmissao", "Condução térmica", "casa_familia"),
        12: ("transmissao", "Convecção térmica", "casa_familia"),
        13: ("transmissao", "Irradiação térmica", "rua_bairro"),
        14: ("termodinamica", "Gases ideais e equação de Clapeyron", "casa_familia"),
        15: ("termodinamica", "Transformações gasosas", "casa_familia"),
        16: ("termodinamica", "Primeira Lei da Termodinâmica", "casa_familia"),
        17: ("termodinamica", "Segunda Lei da Termodinâmica", "casa_familia"),
        18: ("termodinamica", "Máquinas térmicas e rendimento", "transporte"),
        19: ("termodinamica", "Ciclo de Carnot", "casa_familia"),
        20: ("termodinamica", "Revisão de Termodinâmica", "casa_familia"),
        # BIMESTRE 3: ONDULATÓRIA E ACÚSTICA (Semanas 21-30)
        21: ("ondas", "Conceito de onda e classificação", "lazer_tecnologia"),
        22: ("ondas", "Grandezas ondulatórias", "lazer_tecnologia"),
        23: ("ondas", "Reflexão e refração de ondas", "lazer_tecnologia"),
        24: ("ondas", "Interferência e difração", "lazer_tecnologia"),
        25: ("acustica", "Natureza do som e velocidade", "lazer_tecnologia"),
        26: ("acustica", "Qualidades do som (altura, intensidade, timbre)", "lazer_tecnologia"),
        27: ("acustica", "Tubos sonoros e cordas vibrantes", "lazer_tecnologia"),
        28: ("acustica", "Efeito Doppler", "transporte"),
        29: ("acustica", "Aplicações do som", "corpo_saude"),
        30: ("ondas", "Revisão de Ondulatória", "lazer_tecnologia"),
        # BIMESTRE 4: ÓPTICA (Semanas 31-40)
        31: ("optica", "Luz e propagação retilínea", "lazer_tecnologia"),
        32: ("optica", "Reflexão da luz e leis", "casa_familia"),
        33: ("optica", "Espelhos planos", "casa_familia"),
        34: ("optica", "Espelhos esféricos", "transporte"),
        35: ("optica", "Refração da luz e leis", "lazer_tecnologia"),
        36: ("optica", "Lentes esféricas", "corpo_saude"),
        37: ("optica", "Instrumentos ópticos", "corpo_saude"),
        38: ("optica", "Olho humano e defeitos da visão", "corpo_saude"),
        39: ("optica", "Aplicações de óptica", "lazer_tecnologia"),
        40: ("revisao", "Revisão geral do ano", "todos"),
    },
    "3EM": {
        # BIMESTRE 1: ELETROSTÁTICA (Semanas 1-10)
        1: ("eletrostatica", "Carga elétrica e estrutura da matéria", "casa_familia"),
        2: ("eletrostatica", "Processos de eletrização", "casa_familia"),
        3: ("eletrostatica", "Lei de Coulomb", "lazer_tecnologia"),
        4: ("eletrostatica", "Campo elétrico", "lazer_tecnologia"),
        5: ("eletrostatica", "Potencial elétrico", "rua_bairro"),
        6: ("eletrostatica", "Trabalho e energia potencial elétrica", "lazer_tecnologia"),
        7: ("eletrostatica", "Capacitores e capacitância", "lazer_tecnologia"),
        8: ("eletrostatica", "Associação de capacitores", "lazer_tecnologia"),
        9: ("eletrostatica", "Energia armazenada em capacitores", "lazer_tecnologia"),
        10: ("eletrostatica", "Revisão de Eletrostática", "lazer_tecnologia"),
        # BIMESTRE 2: ELETRODINÂMICA (Semanas 11-20)
        11: ("eletrodinamica", "Corrente elétrica e tipos", "casa_familia"),
        12: ("eletrodinamica", "Resistência elétrica e resistores", "casa_familia"),
        13: ("eletrodinamica", "Leis de Ohm", "casa_familia"),
        14: ("eletrodinamica", "Associação de resistores", "casa_familia"),
        15: ("eletrodinamica", "Potência elétrica e efeito Joule", "casa_familia"),
        16: ("eletrodinamica", "Energia elétrica e consumo", "casa_familia"),
        17: ("eletrodinamica", "Geradores e força eletromotriz", "trabalho_profissoes"),
        18: ("eletrodinamica", "Leis de Kirchhoff", "trabalho_profissoes"),
        19: ("eletrodinamica", "Circuitos elétricos", "casa_familia"),
        20: ("eletrodinamica", "Revisão de Eletrodinâmica", "casa_familia"),
        # BIMESTRE 3: MAGNETISMO E ELETROMAGNETISMO (Semanas 21-30)
        21: ("magnetismo", "Ímãs e propriedades magnéticas", "lazer_tecnologia"),
        22: ("magnetismo", "Campo magnético", "lazer_tecnologia"),
        23: ("magnetismo", "Campo magnético de correntes elétricas", "lazer_tecnologia"),
        24: ("magnetismo", "Força magnética sobre cargas e condutores", "lazer_tecnologia"),
        25: ("eletromagnetismo", "Indução eletromagnética", "casa_familia"),
        26: ("eletromagnetismo", "Lei de Faraday e Lei de Lenz", "casa_familia"),
        27: ("eletromagnetismo", "Transformadores", "rua_bairro"),
        28: ("eletromagnetismo", "Ondas eletromagnéticas e espectro", "lazer_tecnologia"),
        29: ("eletromagnetismo", "Aplicações do eletromagnetismo", "lazer_tecnologia"),
        30: ("eletromagnetismo", "Revisão de Eletromagnetismo", "lazer_tecnologia"),
        # BIMESTRE 4: FÍSICA MODERNA (Semanas 31-40)
        31: ("moderna", "Relatividade especial - postulados", "lazer_tecnologia"),
        32: ("moderna", "Equivalência massa-energia (E=mc²)", "lazer_tecnologia"),
        33: ("moderna", "Efeito fotoelétrico", "lazer_tecnologia"),
        34: ("moderna", "Modelo atômico de Bohr", "corpo_saude"),
        35: ("moderna", "Dualidade onda-partícula", "lazer_tecnologia"),
        36: ("moderna", "Radioatividade e tipos de radiação", "corpo_saude"),
        37: ("moderna", "Fissão e fusão nuclear", "rua_bairro"),
        38: ("moderna", "Aplicações da energia nuclear", "corpo_saude"),
        39: ("moderna", "Física contemporânea", "lazer_tecnologia"),
        40: ("revisao", "Revisão geral e preparação ENEM", "todos"),
    }
}

# ============================================================================
# 🎯 PROMPT PARA GERAÇÃO DE QUESTÕES
# ============================================================================

def criar_prompt(serie: str, semana: int, tema: str, subtema: str, contexto: str) -> str:
    """Cria prompt otimizado para gerar questões de alta qualidade"""

    # Selecionar exemplos de contexto
    contextos_exemplos = CONTEXTOS.get(contexto, CONTEXTOS["casa_familia"])
    exemplos = random.sample(contextos_exemplos, min(3, len(contextos_exemplos)))

    serie_nome = {"1EM": "1º ano", "2EM": "2º ano", "3EM": "3º ano"}.get(serie, serie)

    return f"""Você é um professor de Física EXPERIENTE de escola pública brasileira.
Seus alunos são jovens de comunidades periféricas que precisam VER a física no dia-a-dia deles.

🎯 TAREFA: Criar exatamente 6 questões ORIGINAIS sobre "{subtema}"

📋 ESPECIFICAÇÕES:
- Série: {serie_nome} do Ensino Médio
- Semana: {semana} do ano letivo
- Tema: {tema.replace('_', ' ').title()}
- Subtema: {subtema}
- Contextos sugeridos: {', '.join(exemplos)}

📊 DISTRIBUIÇÃO DAS 6 QUESTÕES:
1. Questão FÁCIL - tipo conceitual (sem cálculo)
2. Questão MÉDIA - tipo cálculo_direto
3. Questão MÉDIA - tipo situacao_problema
4. Questão MÉDIA-DIFÍCIL - tipo interpretacao_grafico OU analise_fenomeno
5. Questão MÉDIA-DIFÍCIL - tipo comparacao OU situacao_problema
6. Questão DESAFIO (difícil) - is_desafio = true

🎨 REQUISITOS OBRIGATÓRIOS:

1. CONTEXTO REALISTA DE ESCOLA PÚBLICA:
   - Situações que o aluno VIVE: ônibus lotado, conta de luz alta, chuveiro elétrico, celular
   - Nomes brasileiros populares: João, Maria, Pedro, Ana, Carlos, Fernanda, Lucas, Juliana
   - Locais reais: praça do bairro, quadra da escola, mercadinho, ponto de ônibus, UBS
   - Valores realistas: passagem R$5,50, conta de luz R$150-300, salário mínimo R$1.412

2. ALTERNATIVAS PLAUSÍVEIS (5 opções A-E):
   - TODAS devem parecer possíveis para quem não domina o conteúdo
   - Distratores baseados em ERROS COMUNS dos alunos:
     * Trocar unidades (km/h por m/s sem converter)
     * Esquecer de converter (minutos para segundos, W para kW)
     * Usar fórmula errada (confundir com fórmula parecida)
     * Erro de sinal (esquecer negativo na desaceleração)
     * Confundir conceitos (peso vs massa, calor vs temperatura)
   - NUNCA use alternativas absurdas ou obviamente erradas
   - Diferenças numéricas SUTIS entre alternativas (ex: 12, 15, 18, 20, 24)

3. DICA PEDAGÓGICA:
   - Deve ajudar o raciocínio SEM revelar a resposta
   - Pode sugerir: qual grandeza identificar, que relação usar, uma analogia
   - BOM: "Lembre-se: velocidade média é deslocamento dividido pelo tempo"
   - RUIM: "Use a fórmula v = d/t e divida 100 por 2" (muito direto!)

4. FEEDBACK COMPLETO:
   - explicacao_correta: Passo a passo DETALHADO da resolução
   - erros_comuns: Por que cada alternativa errada está errada
   - conexao_cotidiano: Como isso aparece no dia-a-dia do aluno
   - curiosidade: Fato interessante relacionado ao tema

5. VALORES PADRÃO:
   - g = 10 m/s²
   - Velocidade de ônibus urbano: 30-50 km/h
   - Altura de prédio escolar: 3-4m por andar
   - Conta de luz média casa popular: 150-300 kWh/mês
   - Massa de estudante: 50-70 kg
   - Passagem de ônibus: R$ 4,50 - R$ 5,50

📝 FORMATO JSON - RETORNE APENAS O ARRAY, SEM TEXTO ADICIONAL:
[
  {{
    "ordem": 1,
    "tipo_questao": "conceitual",
    "dificuldade": "facil",
    "is_desafio": false,
    "enunciado": "Texto contextualizado com situação real do cotidiano...",
    "alternativas": {{
      "A": "alternativa plausível baseada em erro comum",
      "B": "alternativa plausível baseada em outro erro",
      "C": "alternativa correta",
      "D": "alternativa plausível baseada em confusão conceitual",
      "E": "alternativa plausível baseada em erro de cálculo"
    }},
    "resposta_correta": "C",
    "dica": "Orientação pedagógica que ajuda sem entregar a resposta...",
    "feedback": {{
      "explicacao_correta": "Passo 1: Identificar...\\nPasso 2: Aplicar...\\nPasso 3: Calcular...\\nResposta: C",
      "erros_comuns": {{
        "A": "Quem marcou A provavelmente confundiu...",
        "B": "Quem marcou B esqueceu de...",
        "D": "Quem marcou D não percebeu que...",
        "E": "Quem marcou E errou ao..."
      }},
      "conexao_cotidiano": "Isso explica por que no dia-a-dia...",
      "curiosidade": "Você sabia que..."
    }},
    "tags": ["cotidiano", "conceitual", "tag_do_tema"]
  }},
  // ... questões 2, 3, 4, 5 ...
  {{
    "ordem": 6,
    "tipo_questao": "situacao_problema",
    "dificuldade": "dificil",
    "is_desafio": true,
    "enunciado": "Desafio mais complexo envolvendo múltiplos conceitos...",
    // ... mesmo formato
  }}
]

⚠️ ERROS A EVITAR:
- Enunciados genéricos sem contexto real
- Alternativas com valores muito diferentes (fácil eliminar por absurdo)
- Dica que entrega a resposta ou indica a alternativa
- Situações irreais (carro a 500 km/h, pessoa de 200 kg, casa gastando 1000 kWh)
- Linguagem muito formal ou científica demais (adapte para o público!)
- JSON malformado ou com campos faltando

Gere EXATAMENTE 6 questões de ALTA QUALIDADE sobre "{subtema}"."""


# ============================================================================
# 🔧 FUNÇÕES DE UTILIDADE
# ============================================================================

def carregar_progresso() -> Dict:
    """Carrega progresso anterior se existir"""
    if os.path.exists(ARQUIVO_PROGRESSO):
        try:
            with open(ARQUIVO_PROGRESSO, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {
        "ultima_execucao": None,
        "questoes_geradas": 0,
        "ultimo_ponto": None,
        "erros": []
    }


def salvar_progresso(progresso: Dict) -> None:
    """Salva progresso atual"""
    progresso["ultima_execucao"] = datetime.now().isoformat()
    with open(ARQUIVO_PROGRESSO, 'w', encoding='utf-8') as f:
        json.dump(progresso, f, ensure_ascii=False, indent=2)


def carregar_backup() -> List:
    """Carrega backup de questões já geradas"""
    if os.path.exists(ARQUIVO_BACKUP):
        try:
            with open(ARQUIVO_BACKUP, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return []


def salvar_backup(questoes: List) -> None:
    """Salva backup local das questões"""
    with open(ARQUIVO_BACKUP, 'w', encoding='utf-8') as f:
        json.dump(questoes, f, ensure_ascii=False, indent=2)


# ============================================================================
# 🤖 FUNÇÕES DE IA
# ============================================================================

def configurar_gemini() -> Any:
    """Configura e retorna o modelo Gemini"""
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-1.5-flash')


def gerar_questoes_ia(model: Any, serie: str, semana: int, tema: str,
                       subtema: str, contexto: str) -> List[Dict]:
    """Gera questões usando Gemini"""

    prompt = criar_prompt(serie, semana, tema, subtema, contexto)

    try:
        response = model.generate_content(prompt)
        texto = response.text.strip()

        # Limpar possíveis marcações de código
        if "```json" in texto:
            texto = texto.split("```json")[1].split("```")[0]
        elif "```" in texto:
            texto = texto.split("```")[1].split("```")[0]

        questoes = json.loads(texto.strip())

        # Validar e enriquecer questões
        for i, q in enumerate(questoes):
            q["serie"] = serie
            q["semana"] = semana
            q["tema"] = tema
            q["subtema"] = subtema
            q["contexto_cotidiano"] = contexto
            q["ano_letivo"] = ANO_LETIVO
            q["competencias_bncc"] = ["EM13CNT101", "EM13CNT301"]

            # Garantir ordem
            if "ordem" not in q:
                q["ordem"] = i + 1

            # Garantir is_desafio
            if "is_desafio" not in q:
                q["is_desafio"] = (i == 5)  # Última é desafio

        return questoes

    except json.JSONDecodeError as e:
        print(f"   ⚠️ Erro ao parsear JSON: {e}")
        return []
    except Exception as e:
        print(f"   ⚠️ Erro na geração: {e}")
        return []


def gerar_embedding(texto: str) -> Optional[List[float]]:
    """Gera embedding usando Gemini"""
    try:
        # Limitar tamanho do texto
        texto_limitado = texto[:8000]

        result = genai.embed_content(
            model="models/text-embedding-004",
            content=texto_limitado
        )
        return result['embedding']
    except Exception as e:
        print(f"   ⚠️ Erro ao gerar embedding: {e}")
        return None


# ============================================================================
# 💾 FUNÇÕES DE BANCO DE DADOS
# ============================================================================

def configurar_supabase() -> Client:
    """Configura e retorna cliente Supabase"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def salvar_questao_supabase(supabase: Client, questao: Dict) -> bool:
    """Salva questão no Supabase com embedding"""
    try:
        # Criar texto para embedding
        texto_embed = f"""
        Enunciado: {questao['enunciado']}
        Tema: {questao['tema']} - {questao['subtema']}
        Alternativas: {json.dumps(questao['alternativas'], ensure_ascii=False)}
        Dica: {questao.get('dica', '')}
        """

        # Gerar embedding
        embedding = gerar_embedding(texto_embed)

        # Preparar dados
        dados = {
            "serie": questao["serie"],
            "semana": questao["semana"],
            "ano_letivo": questao["ano_letivo"],
            "ordem": questao["ordem"],
            "tema": questao["tema"],
            "subtema": questao["subtema"],
            "tipo_questao": questao.get("tipo_questao", "situacao_problema"),
            "contexto_cotidiano": questao["contexto_cotidiano"],
            "enunciado": questao["enunciado"],
            "alternativas": questao["alternativas"],
            "resposta_correta": questao["resposta_correta"],
            "dica": questao.get("dica", ""),
            "feedback": questao.get("feedback", {}),
            "dificuldade": questao.get("dificuldade", "medio"),
            "competencias_bncc": questao.get("competencias_bncc", []),
            "tags": questao.get("tags", []),
            "is_desafio": questao.get("is_desafio", False),
        }

        # Adicionar embedding se gerado
        if embedding:
            dados["embedding"] = embedding

        # Upsert no Supabase
        result = supabase.table("questoes_trilha").upsert(
            dados,
            on_conflict="serie,semana,ano_letivo,ordem"
        ).execute()

        return True

    except Exception as e:
        print(f"   ❌ Erro ao salvar: {e}")
        return False


# ============================================================================
# 🚀 FUNÇÃO PRINCIPAL
# ============================================================================

def gerar_questoes(
    serie_filtro: Optional[str] = None,
    semana_filtro: Optional[int] = None,
    dry_run: bool = False
) -> None:
    """Função principal que orquestra a geração de questões"""

    print("=" * 70)
    print("🚀 GERADOR DE QUESTÕES PARA TRILHAS")
    print("=" * 70)
    print(f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"📆 Ano letivo: {ANO_LETIVO}")

    if dry_run:
        print("⚠️  MODO DRY-RUN: Não salvará no banco de dados")

    # Verificar configuração
    if GEMINI_API_KEY == "SUA_GEMINI_API_KEY":
        print("\n❌ ERRO: Configure GEMINI_API_KEY!")
        print("   export GEMINI_API_KEY='sua-chave-aqui'")
        return

    if not dry_run and SUPABASE_URL == "https://seu-projeto.supabase.co":
        print("\n❌ ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_KEY!")
        return

    # Configurar APIs
    print("\n📡 Configurando APIs...")
    try:
        model = configurar_gemini()
        print("   ✅ Gemini configurado")

        if not dry_run:
            supabase = configurar_supabase()
            print("   ✅ Supabase configurado")
        else:
            supabase = None

    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return

    # Carregar progresso
    progresso = carregar_progresso()
    backup_questoes = carregar_backup()

    print(f"\n📊 Progresso anterior: {progresso['questoes_geradas']} questões")

    # Determinar o que gerar
    series = [serie_filtro] if serie_filtro else ["1EM", "2EM", "3EM"]

    total_geradas = 0
    total_salvas = 0
    erros = []

    # Estimar tempo
    total_semanas = sum(
        len([s for s in range(1, 41) if semana_filtro is None or s == semana_filtro])
        for _ in series
    )
    tempo_estimado = total_semanas * DELAY_ENTRE_CHAMADAS / 60

    print(f"\n⏱️  Tempo estimado: {tempo_estimado:.0f} minutos")
    print("\n" + "=" * 70)
    print("📝 INICIANDO GERAÇÃO...")
    print("=" * 70)

    try:
        for serie in series:
            print(f"\n{'='*50}")
            print(f"📚 SÉRIE: {serie}")
            print(f"{'='*50}")

            cronograma = CRONOGRAMA.get(serie, {})

            for semana in range(1, 41):
                # Filtrar semana se especificado
                if semana_filtro is not None and semana != semana_filtro:
                    continue

                # Buscar dados da semana
                if semana not in cronograma:
                    continue

                tema, subtema, contexto = cronograma[semana]

                print(f"\n  📅 Semana {semana:2d}: {subtema[:45]}...")

                # Gerar questões
                questoes = gerar_questoes_ia(model, serie, semana, tema, subtema, contexto)

                if not questoes:
                    erro = f"{serie}/semana_{semana}"
                    erros.append(erro)
                    print(f"     ❌ Falha na geração")
                    time.sleep(DELAY_ENTRE_CHAMADAS)
                    continue

                print(f"     ✅ {len(questoes)} questões geradas")
                total_geradas += len(questoes)

                # Salvar questões
                for q in questoes:
                    # Adicionar ao backup
                    backup_questoes.append(q)

                    # Salvar no Supabase
                    if not dry_run and supabase:
                        if salvar_questao_supabase(supabase, q):
                            total_salvas += 1
                        else:
                            erros.append(f"{serie}/s{semana}/q{q.get('ordem', '?')}")

                # Atualizar progresso
                progresso["questoes_geradas"] += len(questoes)
                progresso["ultimo_ponto"] = f"{serie}/semana_{semana}"
                progresso["erros"] = erros

                salvar_progresso(progresso)
                salvar_backup(backup_questoes)

                print(f"     💾 Total acumulado: {progresso['questoes_geradas']}")

                # Delay para rate limit
                time.sleep(DELAY_ENTRE_CHAMADAS)

        # Resumo final
        print("\n" + "=" * 70)
        print("🎉 GERAÇÃO CONCLUÍDA!")
        print("=" * 70)
        print(f"\n📊 RESUMO:")
        print(f"   • Questões geradas: {total_geradas}")
        print(f"   • Questões salvas no Supabase: {total_salvas}")
        print(f"   • Total acumulado: {progresso['questoes_geradas']}")
        print(f"   • Erros: {len(erros)}")

        if erros:
            print(f"\n⚠️  Pontos com erro:")
            for e in erros[:10]:
                print(f"   - {e}")
            if len(erros) > 10:
                print(f"   ... e mais {len(erros) - 10}")

        print(f"\n📁 Arquivos gerados:")
        print(f"   • {ARQUIVO_BACKUP}")
        print(f"   • {ARQUIVO_PROGRESSO}")

    except KeyboardInterrupt:
        print("\n\n⏸️  Geração pausada pelo usuário!")
        print(f"   Progresso salvo: {progresso['questoes_geradas']} questões")
        print("   Execute novamente para continuar de onde parou.")
        salvar_progresso(progresso)
        salvar_backup(backup_questoes)


# ============================================================================
# 📋 FUNÇÕES DE UTILIDADE EXTRAS
# ============================================================================

def listar_cronograma(serie: Optional[str] = None) -> None:
    """Lista o cronograma de semanas"""
    print("\n📅 CRONOGRAMA DE SEMANAS")
    print("=" * 70)

    series = [serie] if serie else ["1EM", "2EM", "3EM"]

    for s in series:
        print(f"\n📚 {s}")
        print("-" * 50)

        cronograma = CRONOGRAMA.get(s, {})
        for semana in range(1, 41):
            if semana in cronograma:
                tema, subtema, contexto = cronograma[semana]
                print(f"  {semana:2d}. [{tema[:12]:<12}] {subtema[:40]}")


def verificar_banco(supabase: Client) -> None:
    """Verifica estatísticas do banco"""
    print("\n📊 ESTATÍSTICAS DO BANCO")
    print("=" * 70)

    try:
        # Total
        result = supabase.table("questoes_trilha").select("id", count="exact").execute()
        print(f"\n📚 Total de questões: {result.count}")

        # Por série
        print("\n📈 Por série:")
        for serie in ["1EM", "2EM", "3EM"]:
            result = supabase.table("questoes_trilha").select("id", count="exact").eq("serie", serie).execute()
            print(f"   {serie}: {result.count}")

        # Por dificuldade
        print("\n📈 Por dificuldade:")
        for dif in ["facil", "medio", "dificil"]:
            result = supabase.table("questoes_trilha").select("id", count="exact").eq("dificuldade", dif).execute()
            print(f"   {dif}: {result.count}")

    except Exception as e:
        print(f"\n❌ Erro: {e}")


# ============================================================================
# 🚀 EXECUÇÃO
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Gerador de Questões para Sistema de Trilhas",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python gerador_questoes_trilhas.py                    # Gerar tudo
  python gerador_questoes_trilhas.py --serie 1EM       # Só 1º ano
  python gerador_questoes_trilhas.py --semana 5        # Semana 5 de todas
  python gerador_questoes_trilhas.py --serie 2EM --semana 10
  python gerador_questoes_trilhas.py --cronograma      # Ver cronograma
  python gerador_questoes_trilhas.py --stats           # Ver estatísticas
  python gerador_questoes_trilhas.py --dry-run         # Testar sem salvar
        """
    )

    parser.add_argument("--serie", choices=["1EM", "2EM", "3EM"],
                        help="Série específica para gerar")
    parser.add_argument("--semana", type=int, choices=range(1, 41),
                        metavar="[1-40]", help="Semana específica")
    parser.add_argument("--cronograma", action="store_true",
                        help="Mostrar cronograma de semanas")
    parser.add_argument("--stats", action="store_true",
                        help="Mostrar estatísticas do banco")
    parser.add_argument("--dry-run", action="store_true",
                        help="Executar sem salvar no banco")

    args = parser.parse_args()

    if args.cronograma:
        listar_cronograma(args.serie)
    elif args.stats:
        if SUPABASE_URL != "https://seu-projeto.supabase.co":
            supabase = configurar_supabase()
            verificar_banco(supabase)
        else:
            print("❌ Configure SUPABASE_URL primeiro!")
    else:
        gerar_questoes(
            serie_filtro=args.serie,
            semana_filtro=args.semana,
            dry_run=args.dry_run
        )
