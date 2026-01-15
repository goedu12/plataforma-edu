#!/usr/bin/env python3
"""
Insere questões de exemplo diretamente no Supabase
"""

import json
import urllib.request
import ssl
import time

SUPABASE_URL = "https://qjrjkjknesacrurvcthu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcmpramtuZXNhY3J1cnZjdGh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE5Njg5NiwiZXhwIjoyMDgyNzcyODk2fQ.nbdjoDFuNbQ3LSSUXUByJjL0iDBhni-mvrJTn-tkUxM"

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

QUESTOES = [
    # 1EM - Semana 1 - Cinemática
    {
        "id": "ex-1em-s1-q1",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 1,
        "tema": "Cinemática",
        "subtema": "Velocidade Média",
        "tipo_questao": "calculo_direto",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Transporte",
        "enunciado": "Um ônibus escolar percorre 12 km em 20 minutos para levar os alunos até a escola. Qual é a velocidade média do ônibus?",
        "alternativas": {"A": "36 km/h", "B": "24 km/h", "C": "12 km/h", "D": "60 km/h", "E": "0,6 km/h"},
        "resposta_correta": "A",
        "dica": "Lembre-se: velocidade média = distância ÷ tempo. Converta os minutos para horas primeiro!",
        "feedback": "A velocidade média é calculada dividindo a distância pelo tempo. Primeiro, convertemos 20 minutos para horas: 20/60 = 1/3 h ≈ 0,333 h. Então: v = 12 km ÷ 0,333 h = 36 km/h. A resposta é A."
    },
    {
        "id": "ex-1em-s1-q2",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 2,
        "tema": "Cinemática",
        "subtema": "MRU",
        "tipo_questao": "calculo_direto",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Esporte",
        "enunciado": "Durante a aula de educação física, um aluno corre com velocidade constante de 5 m/s. Quanto tempo ele leva para percorrer os 100 metros da pista?",
        "alternativas": {"A": "10 s", "B": "20 s", "C": "500 s", "D": "0,05 s", "E": "50 s"},
        "resposta_correta": "B",
        "dica": "No MRU, use a fórmula: tempo = distância ÷ velocidade",
        "feedback": "No Movimento Retilíneo Uniforme (MRU), temos t = d/v. Substituindo: t = 100m ÷ 5m/s = 20s. O aluno leva 20 segundos para percorrer a pista. Resposta: B"
    },
    {
        "id": "ex-1em-s1-q3",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 3,
        "tema": "Cinemática",
        "subtema": "Velocidade Média",
        "tipo_questao": "situacao_problema",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Viagem",
        "enunciado": "Maria vai de casa até a escola, que fica a 6 km de distância. Na ida, demora 30 minutos. Na volta, por causa do trânsito, demora 1 hora. Qual foi a velocidade média de Maria no trajeto completo (ida e volta)?",
        "alternativas": {"A": "6 km/h", "B": "8 km/h", "C": "9 km/h", "D": "12 km/h", "E": "4 km/h"},
        "resposta_correta": "B",
        "dica": "Velocidade média total = distância total ÷ tempo total. Cuidado: não é a média das velocidades!",
        "feedback": "Distância total = 6 km (ida) + 6 km (volta) = 12 km. Tempo total = 0,5 h (ida) + 1 h (volta) = 1,5 h. Velocidade média = 12 km ÷ 1,5 h = 8 km/h. Resposta: B"
    },
    {
        "id": "ex-1em-s1-q4",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 4,
        "tema": "Cinemática",
        "subtema": "Aceleração",
        "tipo_questao": "calculo_direto",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Transporte",
        "enunciado": "Um carro parte do repouso e acelera uniformemente. Após 10 segundos, sua velocidade é de 20 m/s. Qual é a aceleração do carro?",
        "alternativas": {"A": "0,5 m/s²", "B": "2 m/s²", "C": "10 m/s²", "D": "200 m/s²", "E": "30 m/s²"},
        "resposta_correta": "B",
        "dica": "Aceleração = variação de velocidade ÷ tempo. O carro partiu do repouso (v₀ = 0).",
        "feedback": "Aceleração é a taxa de variação da velocidade: a = Δv/Δt = (20 - 0)/10 = 2 m/s². O carro acelera 2 metros por segundo a cada segundo. Resposta: B"
    },
    {
        "id": "ex-1em-s1-q5",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 5,
        "tema": "Cinemática",
        "subtema": "Referencial",
        "tipo_questao": "analise_fenomeno",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Observação",
        "enunciado": "Uma pessoa dentro de um ônibus em movimento olha pela janela e vê as árvores 'andando para trás'. Por que isso acontece?",
        "alternativas": {"A": "As árvores realmente se movem", "B": "É uma ilusão causada pela luz", "C": "O movimento é relativo - em relação à pessoa, as árvores se movem", "D": "O vento empurra as árvores", "E": "É um erro de percepção do cérebro"},
        "resposta_correta": "C",
        "dica": "Pense no conceito de referencial em Física. O movimento depende de quem está observando.",
        "feedback": "O movimento é sempre relativo a um referencial. Para a pessoa no ônibus (referencial em movimento), as árvores parecem se mover no sentido oposto. Se a pessoa estivesse parada na rua, veria o ônibus passar. Tudo depende do ponto de vista! Resposta: C"
    },
    {
        "id": "ex-1em-s1-q6",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 6,
        "tema": "Cinemática",
        "subtema": "Conversão de Unidades",
        "tipo_questao": "comparacao",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Trânsito",
        "enunciado": "A velocidade máxima em uma avenida é de 60 km/h. Um radar registrou um carro a 20 m/s. O carro estava acima do limite?",
        "alternativas": {"A": "Sim, estava a 72 km/h", "B": "Não, estava a 54 km/h", "C": "Sim, estava a 80 km/h", "D": "Não, estava a 60 km/h", "E": "Sim, estava a 200 km/h"},
        "resposta_correta": "A",
        "dica": "Para converter m/s para km/h, multiplique por 3,6",
        "feedback": "Para converter m/s para km/h: 20 m/s × 3,6 = 72 km/h. O carro estava a 72 km/h, acima do limite de 60 km/h. Resposta: A"
    },
    {
        "id": "ex-1em-s1-q7",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 7,
        "tema": "Cinemática",
        "subtema": "Queda Livre",
        "tipo_questao": "analise_fenomeno",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Observação",
        "enunciado": "Se você soltar uma bola de tênis e uma bola de boliche da mesma altura ao mesmo tempo (desprezando a resistência do ar), qual chegará primeiro ao chão?",
        "alternativas": {"A": "A bola de boliche, por ser mais pesada", "B": "A bola de tênis, por ser mais leve", "C": "Chegam ao mesmo tempo", "D": "Depende da altura", "E": "A bola de tênis, pois tem menos inércia"},
        "resposta_correta": "C",
        "dica": "Lembre-se do experimento de Galileu: a aceleração da gravidade é igual para todos os corpos!",
        "feedback": "Na queda livre (sem resistência do ar), todos os corpos caem com a mesma aceleração g ≈ 10 m/s², independente da massa. Galileu demonstrou isso na Torre de Pisa! Ambas chegam juntas. Resposta: C"
    },
    {
        "id": "ex-1em-s1-q8",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 8,
        "tema": "Cinemática",
        "subtema": "Deslocamento",
        "tipo_questao": "situacao_problema",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Caminhada",
        "enunciado": "João caminha 300m para o norte e depois 400m para o leste. Qual foi o deslocamento total de João?",
        "alternativas": {"A": "100 m", "B": "700 m", "C": "500 m", "D": "350 m", "E": "1200 m"},
        "resposta_correta": "C",
        "dica": "O deslocamento é a distância em linha reta do ponto inicial ao final. Use o teorema de Pitágoras!",
        "feedback": "O deslocamento forma um triângulo retângulo. Usando Pitágoras: d² = 300² + 400² = 90000 + 160000 = 250000. Portanto, d = √250000 = 500m. Note que o deslocamento (500m) é diferente da distância percorrida (700m). Resposta: C"
    },
    {
        "id": "ex-1em-s1-q9",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 9,
        "tema": "Cinemática",
        "subtema": "MRUV",
        "tipo_questao": "calculo_direto",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Carro",
        "enunciado": "Um carro freia de 20 m/s até parar completamente em 4 segundos. Qual é a desaceleração do carro?",
        "alternativas": {"A": "5 m/s²", "B": "-5 m/s²", "C": "80 m/s²", "D": "-80 m/s²", "E": "4 m/s²"},
        "resposta_correta": "B",
        "dica": "Desaceleração é aceleração negativa. Use a = (v_final - v_inicial) / tempo",
        "feedback": "a = (v - v₀) / t = (0 - 20) / 4 = -20/4 = -5 m/s². O sinal negativo indica que o carro está diminuindo a velocidade (desacelerando). Resposta: B"
    },
    {
        "id": "ex-1em-s1-q10",
        "trilha_id": "passar_ano",
        "serie": "1EM",
        "semana": 1,
        "ordem": 10,
        "tema": "Cinemática",
        "subtema": "MRU",
        "tipo_questao": "calculo_direto",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Viagem",
        "enunciado": "Um trem viaja a 90 km/h. Quantos quilômetros ele percorre em 2 horas e 30 minutos?",
        "alternativas": {"A": "180 km", "B": "225 km", "C": "200 km", "D": "270 km", "E": "45 km"},
        "resposta_correta": "B",
        "dica": "Use d = v × t. Converta 2h30min para horas decimais primeiro.",
        "feedback": "2 horas e 30 minutos = 2,5 horas. Distância = velocidade × tempo = 90 km/h × 2,5 h = 225 km. Resposta: B"
    },
    # 2EM - Semana 1 - Termologia
    {
        "id": "ex-2em-s1-q1",
        "trilha_id": "passar_ano",
        "serie": "2EM",
        "semana": 1,
        "ordem": 1,
        "tema": "Termologia",
        "subtema": "Escalas Termométricas",
        "tipo_questao": "calculo_direto",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Clima",
        "enunciado": "A temperatura ambiente está em 25°C. Qual é essa temperatura em Kelvin?",
        "alternativas": {"A": "248 K", "B": "298 K", "C": "25 K", "D": "273 K", "E": "300 K"},
        "resposta_correta": "B",
        "dica": "Para converter Celsius para Kelvin: K = °C + 273",
        "feedback": "A escala Kelvin começa no zero absoluto (-273°C). Para converter: K = °C + 273 = 25 + 273 = 298 K. Resposta: B"
    },
    {
        "id": "ex-2em-s1-q2",
        "trilha_id": "passar_ano",
        "serie": "2EM",
        "semana": 1,
        "ordem": 2,
        "tema": "Termologia",
        "subtema": "Propagação de Calor",
        "tipo_questao": "conceitual",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Cozinha",
        "enunciado": "Ao colocar uma colher de metal em uma panela quente, a colher esquenta rapidamente. Isso ocorre principalmente por qual processo?",
        "alternativas": {"A": "Convecção", "B": "Radiação", "C": "Condução", "D": "Evaporação", "E": "Sublimação"},
        "resposta_correta": "C",
        "dica": "O calor se propaga pelo contato direto entre a panela e a colher. Qual processo descreve isso?",
        "feedback": "A condução é a transferência de calor através do contato direto entre materiais. Os metais são excelentes condutores térmicos, por isso a colher esquenta rápido. Resposta: C"
    },
    {
        "id": "ex-2em-s1-q3",
        "trilha_id": "passar_ano",
        "serie": "2EM",
        "semana": 1,
        "ordem": 3,
        "tema": "Termologia",
        "subtema": "Calor Sensível",
        "tipo_questao": "calculo_direto",
        "dificuldade": "medio",
        "contexto": "Cotidiano - Cozinha",
        "enunciado": "Quantas calorias são necessárias para aquecer 500g de água de 20°C para 80°C? (calor específico da água = 1 cal/g°C)",
        "alternativas": {"A": "30000 cal", "B": "40000 cal", "C": "500 cal", "D": "3000 cal", "E": "60 cal"},
        "resposta_correta": "A",
        "dica": "Use a fórmula Q = m × c × ΔT (massa × calor específico × variação de temperatura)",
        "feedback": "Q = m × c × ΔT = 500g × 1 cal/g°C × (80-20)°C = 500 × 1 × 60 = 30000 cal. São necessárias 30 mil calorias. Resposta: A"
    },
    {
        "id": "ex-2em-s1-q4",
        "trilha_id": "passar_ano",
        "serie": "2EM",
        "semana": 1,
        "ordem": 4,
        "tema": "Termologia",
        "subtema": "Dilatação Térmica",
        "tipo_questao": "analise_fenomeno",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Construção",
        "enunciado": "Por que existem pequenas frestas (juntas de dilatação) entre os trilhos de trem?",
        "alternativas": {"A": "Para economizar material", "B": "Para permitir a dilatação térmica", "C": "Para reduzir o barulho", "D": "Para facilitar a instalação", "E": "Por erro de construção"},
        "resposta_correta": "B",
        "dica": "Metais expandem quando aquecidos. O que aconteceria se não houvesse espaço para expandir?",
        "feedback": "Os trilhos de metal se expandem no calor e contraem no frio. Sem as frestas (juntas de dilatação), a expansão causaria deformação, podendo causar acidentes graves. Resposta: B"
    },
    {
        "id": "ex-2em-s1-q5",
        "trilha_id": "passar_ano",
        "serie": "2EM",
        "semana": 1,
        "ordem": 5,
        "tema": "Termologia",
        "subtema": "Equilíbrio Térmico",
        "tipo_questao": "conceitual",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Bebidas",
        "enunciado": "Ao colocar gelo em um copo com água em temperatura ambiente, o que acontece?",
        "alternativas": {"A": "Só a água esfria", "B": "Só o gelo esquenta", "C": "A água cede calor ao gelo até atingirem equilíbrio térmico", "D": "Nada acontece", "E": "O gelo cede calor à água"},
        "resposta_correta": "C",
        "dica": "O calor sempre flui do corpo mais quente para o mais frio. O que acontece até as temperaturas se igualarem?",
        "feedback": "A água (mais quente) cede calor ao gelo (mais frio). Isso continua até ambos atingirem a mesma temperatura - o equilíbrio térmico. A água esfria e o gelo derrete. Resposta: C"
    },
    # 3EM - Semana 1 - Eletrostática
    {
        "id": "ex-3em-s1-q1",
        "trilha_id": "passar_ano",
        "serie": "3EM",
        "semana": 1,
        "ordem": 1,
        "tema": "Eletrostática",
        "subtema": "Eletrização",
        "tipo_questao": "analise_fenomeno",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Roupas",
        "enunciado": "Ao tirar uma blusa de lã no escuro, você percebe pequenos estalos e faíscas. Isso ocorre devido a:",
        "alternativas": {"A": "Corrente elétrica da tomada", "B": "Campo magnético da Terra", "C": "Eletricidade estática por atrito", "D": "Ondas eletromagnéticas", "E": "Curto-circuito"},
        "resposta_correta": "C",
        "dica": "O atrito entre materiais diferentes pode transferir elétrons de um para outro.",
        "feedback": "O atrito entre a blusa de lã e a pele/cabelo transfere elétrons, criando cargas elétricas estáticas. Quando a diferença de potencial é grande, ocorre uma descarga elétrica (as faíscas). Resposta: C"
    },
    {
        "id": "ex-3em-s1-q2",
        "trilha_id": "passar_ano",
        "serie": "3EM",
        "semana": 1,
        "ordem": 2,
        "tema": "Eletrostática",
        "subtema": "Lei de Coulomb",
        "tipo_questao": "conceitual",
        "dificuldade": "medio",
        "contexto": "Conceitual",
        "enunciado": "Duas cargas elétricas positivas estão separadas por uma distância d. Se a distância for duplicada (2d), a força entre elas será:",
        "alternativas": {"A": "O dobro", "B": "A metade", "C": "Um quarto (1/4)", "D": "Quatro vezes maior", "E": "Igual"},
        "resposta_correta": "C",
        "dica": "Pela Lei de Coulomb, a força é inversamente proporcional ao QUADRADO da distância.",
        "feedback": "Pela Lei de Coulomb: F ∝ 1/d². Se d dobra (×2), d² quadruplica (×4), então F fica 1/4 do valor original. Se a distância dobra, a força cai para um quarto. Resposta: C"
    },
    {
        "id": "ex-3em-s1-q3",
        "trilha_id": "passar_ano",
        "serie": "3EM",
        "semana": 1,
        "ordem": 3,
        "tema": "Eletrostática",
        "subtema": "Campo Elétrico",
        "tipo_questao": "conceitual",
        "dificuldade": "medio",
        "contexto": "Conceitual",
        "enunciado": "O campo elétrico gerado por uma carga POSITIVA aponta:",
        "alternativas": {"A": "Em direção à carga", "B": "Para longe da carga (radialmente para fora)", "C": "Em círculos ao redor da carga", "D": "Sempre para cima", "E": "Não existe campo"},
        "resposta_correta": "B",
        "dica": "Imagine uma carga de prova positiva: ela seria atraída ou repelida pela carga positiva?",
        "feedback": "O campo elétrico aponta na direção da força que atuaria em uma carga de prova positiva. Como cargas iguais se repelem, o campo de uma carga positiva aponta radialmente para fora (afastando-se da carga). Resposta: B"
    },
    {
        "id": "ex-3em-s1-q4",
        "trilha_id": "passar_ano",
        "serie": "3EM",
        "semana": 1,
        "ordem": 4,
        "tema": "Eletrostática",
        "subtema": "Condutores",
        "tipo_questao": "analise_fenomeno",
        "dificuldade": "facil",
        "contexto": "Cotidiano - Segurança",
        "enunciado": "Por que os para-raios são feitos de metal e conectados ao solo?",
        "alternativas": {"A": "Porque metal é mais bonito", "B": "Porque metal é bom condutor e leva a eletricidade para o solo", "C": "Porque metal é mais barato", "D": "Porque metal é mais pesado", "E": "Porque metal não conduz eletricidade"},
        "resposta_correta": "B",
        "dica": "Metais são bons condutores elétricos. O que é mais seguro: a eletricidade passar pelo prédio ou por um caminho alternativo?",
        "feedback": "O para-raios oferece um caminho de baixa resistência para a corrente do raio. O metal conduz a eletricidade com segurança até o solo (aterramento), protegendo a edificação e as pessoas. Resposta: B"
    },
    {
        "id": "ex-3em-s1-q5",
        "trilha_id": "passar_ano",
        "serie": "3EM",
        "semana": 1,
        "ordem": 5,
        "tema": "Eletrostática",
        "subtema": "Cargas Elétricas",
        "tipo_questao": "conceitual",
        "dificuldade": "facil",
        "contexto": "Conceitual",
        "enunciado": "Um átomo neutro possui:",
        "alternativas": {"A": "Mais prótons que elétrons", "B": "Mais elétrons que prótons", "C": "Mesmo número de prótons e elétrons", "D": "Apenas prótons", "E": "Apenas elétrons"},
        "resposta_correta": "C",
        "dica": "Neutro significa carga elétrica total igual a zero. Prótons têm carga + e elétrons têm carga -.",
        "feedback": "Um átomo neutro possui o mesmo número de prótons (carga +) e elétrons (carga -), resultando em carga líquida zero. Se perder ou ganhar elétrons, torna-se um íon. Resposta: C"
    }
]

def inserir_questoes():
    url = f"{SUPABASE_URL}/rest/v1/questoes_trilha"

    # Primeiro, deletar questões de exemplo existentes
    print("🗑️  Removendo questões de exemplo anteriores...")
    delete_url = f"{url}?id=like.ex-*"
    req = urllib.request.Request(
        delete_url,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        },
        method='DELETE'
    )
    try:
        with urllib.request.urlopen(req, timeout=30, context=ssl_context) as response:
            print("✅ Questões antigas removidas")
    except Exception as e:
        print(f"⚠️  Aviso ao remover: {e}")

    print(f"\n📝 Inserindo {len(QUESTOES)} questões de exemplo...")

    sucesso = 0
    for q in QUESTOES:
        req = urllib.request.Request(
            url,
            data=json.dumps(q).encode('utf-8'),
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
                sucesso += 1
                print(f"  ✅ {q['id']} - {q['serie']} S{q['semana']} Q{q['ordem']}")
        except urllib.error.HTTPError as e:
            error = e.read().decode()
            if "duplicate" in error.lower():
                print(f"  ⏭️  {q['id']} - já existe")
                sucesso += 1
            else:
                print(f"  ❌ {q['id']} - Erro: {error[:100]}")
        except Exception as e:
            print(f"  ❌ {q['id']} - Erro: {e}")

        time.sleep(0.1)  # Pequeno delay

    print(f"\n✅ Concluído! {sucesso}/{len(QUESTOES)} questões inseridas")
    print("\nQuestões disponíveis:")
    print("  - 1EM Semana 1: 10 questões de Cinemática")
    print("  - 2EM Semana 1: 5 questões de Termologia")
    print("  - 3EM Semana 1: 5 questões de Eletrostática")

if __name__ == "__main__":
    inserir_questoes()
