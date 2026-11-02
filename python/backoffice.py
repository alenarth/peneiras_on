"""Peneiras On - back-office do MVP Concierge (CTWP, Sprint 4).

Fluxo: site -> planilha (aba Inscricoes) -> equipe baixa o CSV -> este script
valida, calcula o score, classifica, ranqueia e gera o resultados.csv que a
equipe devolve ao jogador. Contrato das colunas: python/CONTRATO.md
"""

import csv
from datetime import date, datetime

# ---- constantes (origem: Sprint 3, dados.py) ----
IDADE_MIN = 7
IDADE_MAX = 19
MAIORIDADE = 18
SCORE_ELEGIVEL = 60
SCORE_CONVOCADO = 85

ESTADOS = {'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
           'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
           'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'}

POSICOES = {'GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'VOLANTE', 'MEIA', 'PONTA', 'ATACANTE'}

PE_DOMINANTE = {'DIREITO', 'ESQUERDO', 'AMBIDESTRO'}

# pesos do score de completude (os do site, exceto video: 25 por decisao da equipe)
PESOS = {'nome': 8, 'nascimento': 8, 'cpf': 10, 'posicao': 10,
         'pe': 4, 'altura': 4, 'peso': 4, 'clube': 6,
         'anos_pratica': 4, 'video': 25, 'foto': 8}

# colunas do resultados.csv (sem CPF: o jogador consulta pelo codigo)
COLUNAS_RESULTADO = ['codigo', 'nome', 'posicao', 'uf', 'score', 'status', 'ranking']

ARQUIVO_RESULTADOS = 'resultados.csv'

# inicio de celula que planilha le como formula (CSV injection, OWASP)
PREFIXOS_FORMULA = ('=', '+', '-', '@', '\t', '\r')

# formato de um atleta depois de carregado e processado (exemplo):
# {'codigo': '3f2a...', 'nome': 'Kaua Ferreira', 'nascimento': '2008-03-12',
#  'cpf': '11111111111', 'uf': 'RJ', 'cidade': 'Duque de Caxias',
#  'posicao': 'ATACANTE', 'pe': 'DIREITO', ..., 'foto': 'S', 'aceite_termo': '',
#  'idade': 18, 'score': 91, 'status': 'CONVOCADO', 'ranking': 1}


def carregar_inscricoes(caminho: str) -> list:
    """Le o CSV baixado da aba Inscricoes.

    caminho (str): caminho do arquivo .csv.
    retorno (list): lista de dicionarios, um por linha (chave = nome da coluna).
    """
    inscricoes = []
    with open(caminho, 'r', encoding='utf-8', newline='') as arquivo:
        leitor = csv.DictReader(arquivo)
        for linha in leitor:
            tratamento = {}
            for chave, valor in linha.items():
                valor = (valor or '').strip()  # celula faltando vem como None
                if valor.startswith("'"):      # ' que o Apps Script poe contra formula
                    valor = valor[1:]
                tratamento[chave] = valor
            inscricoes.append(tratamento)
    return inscricoes


def calcular_idade(nascimento: str) -> int:
    """Idade em anos completos a partir da data do CSV.

    nascimento (str): data no formato AAAA-MM-DD.
    retorno (int): idade hoje.
    """
    data_nascimento = datetime.strptime(nascimento, '%Y-%m-%d')
    hoje = date.today()
    idade = hoje.year - data_nascimento.year
    # tupla compara o mes primeiro e, se empatar, o dia: (10, 30) < (12, 12)
    if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
        idade -= 1
    return idade


def validar_inscricao(atleta: dict) -> list:
    """Confere se a inscricao respeita as regras de negocio.

    O site ja valida, mas a planilha aceita dado de qualquer um que tenha a URL,
    entao o Python valida de novo.

    atleta (dict): uma linha do CSV.
    retorno (list): lista de motivos de recusa (vazia = inscricao valida).
    """
    motivos = []

    if not atleta['nome']:
        motivos.append('nome vazio')

    try:
        idade = calcular_idade(atleta['nascimento'])
    except ValueError:
        motivos.append('data de nascimento invalida')
    else:
        # so roda se a data deu certo: sem data nao ha idade
        if idade < IDADE_MIN or idade > IDADE_MAX:
            motivos.append(f'idade fora da faixa permitida ({IDADE_MIN:02d}-{IDADE_MAX})')
        elif idade < MAIORIDADE:
            if not atleta['responsavel']:
                motivos.append('menor sem responsavel')
            if not atleta['tel_responsavel']:
                motivos.append('menor sem telefone do responsavel')
            if atleta['aceite_termo'] != 'S':
                motivos.append('menor sem aceite do termo')

    if not atleta['cpf'].isdigit() or len(atleta['cpf']) != 11:
        motivos.append('CPF invalido')
    if atleta['uf'].upper() not in ESTADOS:
        motivos.append('UF invalida')
    if not atleta['cidade']:
        motivos.append('cidade vazia')
    if atleta['posicao'].upper() not in POSICOES:
        motivos.append('posicao invalida')
    if atleta['pe'].upper() not in PE_DOMINANTE:
        motivos.append('pe dominante invalido')

    return motivos


def calcular_score(atleta: dict) -> int:
    """Score de completude do perfil (0 a 100).

    atleta (dict): inscricao ja validada.
    retorno (int): soma dos pesos dos campos preenchidos, com teto 100.
    """
    total = 0
    for chave, peso in PESOS.items():
        if chave == 'foto':
            # foto vem 'S' ou 'N'; 'N' nao e vazio, entao so conta com 'S'
            if atleta['foto'] == 'S':
                total += peso
        elif atleta[chave]:
            total += peso

    # fora do PESOS: UF e cidade so valem juntas; aceite so vale com 'S'
    if atleta['uf'] and atleta['cidade']:
        total += 8
    if atleta['aceite_termo'] == 'S':
        total += 8

    if total > 100:
        total = 100
    return total


def classificar(score: int) -> str:
    """Status do atleta pela regra de negocio.

    score (int): score de completude.
    retorno (str): 'CONVOCADO' (>= 85), 'ELEGIVEL' (>= 60) ou 'NAO ELEGIVEL'.
    """
    # do maior para o menor: 90 tambem e >= 60 e pararia no ELEGIVEL
    if score >= SCORE_CONVOCADO:
        return 'CONVOCADO'
    elif score >= SCORE_ELEGIVEL:
        return 'ELEGIVEL'
    else:
        return 'NAO ELEGIVEL'


def processar(inscricoes: list) -> tuple:
    """Valida e processa todas as inscricoes carregadas.

    inscricoes (list): saida de carregar_inscricoes.
    retorno (tuple): (aprovados, recusados)
        aprovados (list): atletas validos, com 'idade', 'score' e 'status'
        recusados (list): dicionarios {'codigo', 'nome', 'motivos'}
    """
    aprovados = []
    recusados = []
    for inscricao in inscricoes:
        motivos = validar_inscricao(inscricao)
        if motivos:
            # so o necessario para a equipe responder; sem CPF
            recusados.append({'codigo': inscricao['codigo'],
                              'nome': inscricao['nome'],
                              'motivos': motivos})
        else:
            # padroniza uma vez so: o CSV vem 'Atacante', 'rj'
            inscricao['uf'] = inscricao['uf'].upper()
            inscricao['posicao'] = inscricao['posicao'].upper()
            inscricao['pe'] = inscricao['pe'].upper()
            inscricao['idade'] = calcular_idade(inscricao['nascimento'])
            inscricao['score'] = calcular_score(inscricao)
            inscricao['status'] = classificar(inscricao['score'])
            aprovados.append(inscricao)
    return aprovados, recusados


def gerar_ranking(atletas: list) -> list:
    """Ordena os atletas do maior para o menor score e numera o ranking.

    atletas (list): atletas aprovados.
    retorno (list): nova lista ordenada, cada atleta com a chave 'ranking'.
    """
    ordenados = sorted(atletas, key=lambda atleta: atleta['score'], reverse=True)
    for posicao, atleta in enumerate(ordenados, start=1):
        atleta['ranking'] = posicao
    return ordenados


def calcular_metricas(aprovados: list, recusados: list) -> dict:
    """Numeros gerais da rodada para a equipe.

    Elegiveis seguem o funil do site: todo convocado tambem e elegivel.

    aprovados (list): atletas validos.
    recusados (list): inscricoes recusadas.
    retorno (dict): total, recusados, elegiveis, convocados, score_medio, pct_video.
    """
    elegiveis = 0
    convocados = 0
    soma_scores = 0
    com_video = 0
    for atleta in aprovados:
        if atleta['score'] >= SCORE_ELEGIVEL:
            elegiveis += 1
        if atleta['status'] == 'CONVOCADO':
            convocados += 1
        if atleta['video']:
            com_video += 1
        soma_scores += atleta['score']

    # sem aprovados, media e percentual ficam em 0 (evita divisao por zero)
    score_medio = 0
    pct_video = 0
    if aprovados:
        score_medio = round(soma_scores / len(aprovados), 1)
        pct_video = round(com_video / len(aprovados) * 100, 1)

    return {'total': len(aprovados) + len(recusados),
            'recusados': len(recusados),
            'elegiveis': elegiveis,
            'convocados': convocados,
            'score_medio': score_medio,
            'pct_video': pct_video}


def mostrar_ranking(atletas: list) -> None:
    """Imprime a tabela do ranking no terminal.

    atletas (list): atletas ja ranqueados.
    retorno (None): so imprime.
    """
    if not atletas:
        print('Nenhum atleta aprovado nesta rodada.')
        return
    print(f"\n{'#':>3}  {'NOME':<25} {'POSICAO':<9} {'UF':<3} {'SCORE':>5}  STATUS")
    for atleta in atletas:
        print(f"{atleta['ranking']:>3}  {atleta['nome'][:25]:<25} {atleta['posicao']:<9} "
              f"{atleta['uf']:<3} {atleta['score']:>5}  {atleta['status']}")


def mostrar_metricas(metricas: dict) -> None:
    """Imprime as metricas da rodada.

    metricas (dict): saida de calcular_metricas.
    retorno (None): so imprime.
    """
    print('\n--- Metricas da rodada ---')
    print(f"Inscricoes recebidas: {metricas['total']}")
    print(f"Recusadas na validacao: {metricas['recusados']}")
    print(f"Elegiveis (score >= {SCORE_ELEGIVEL}): {metricas['elegiveis']}")
    print(f"Convocados (score >= {SCORE_CONVOCADO}): {metricas['convocados']}")
    print(f"Score medio dos aprovados: {metricas['score_medio']}")
    print(f"Aprovados com video: {metricas['pct_video']}%")


def mostrar_recusados(recusados: list) -> None:
    """Imprime as inscricoes recusadas e o motivo de cada uma.

    recusados (list): saida de processar.
    retorno (None): so imprime.
    """
    if not recusados:
        print('Nenhuma inscricao recusada.')
        return
    for recusado in recusados:
        nome = recusado['nome'] or '(sem nome)'
        print(f"\n{nome} - codigo {recusado['codigo']}")
        for motivo in recusado['motivos']:
            print(f'  - {motivo}')


def buscar_por_codigo(registros: list, codigo: str) -> dict | None:
    """Procura uma inscricao pelo codigo (busca linear).

    registros (list): aprovados ou recusados (os dois tem a chave 'codigo').
    codigo (str): codigo (UUID) que o jogador recebeu.
    retorno (dict ou None): o registro, ou None se nao achar.
    """
    for registro in registros:
        if registro['codigo'] == codigo:
            return registro
    return None


def mostrar_consulta(aprovados: list, recusados: list, codigo: str) -> None:
    """Imprime a resposta que a equipe devolve ao jogador que informou o codigo.

    aprovados (list): atletas ranqueados.
    recusados (list): inscricoes recusadas.
    codigo (str): codigo da inscricao.
    retorno (None): so imprime.
    """
    atleta = buscar_por_codigo(aprovados, codigo)
    if atleta:
        print(f"\n{atleta['nome']} ({atleta['idade']} anos) - {atleta['posicao']}, {atleta['uf']}")
        print(f"Score: {atleta['score']} | Status: {atleta['status']} | "
              f"Ranking: {atleta['ranking']} de {len(aprovados)}")
        return
    recusado = buscar_por_codigo(recusados, codigo)
    if recusado:
        print(f"\nInscricao recusada. Motivos: {', '.join(recusado['motivos'])}")
    else:
        print('Codigo nao encontrado.')


def proteger_formula(valor) -> str:
    """Neutraliza um valor que o Excel/Sheets executaria como formula.

    O carregar_inscricoes tira o ' do Apps Script; aqui ele volta antes de exportar.

    valor: conteudo de uma celula (str ou int).
    retorno (str): o valor como texto, com ' na frente se comecar como formula.
    """
    texto = str(valor)
    if texto.startswith(PREFIXOS_FORMULA):
        return "'" + texto
    return texto


def exportar_resultados(atletas: list, caminho: str) -> None:
    """Grava o resultados.csv que a equipe devolve ao jogador.

    atletas (list): atletas ranqueados.
    caminho (str): caminho do arquivo de saida.
    retorno (None): so grava o arquivo.
    """
    with open(caminho, 'w', encoding='utf-8', newline='') as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS_RESULTADO)
        escritor.writeheader()
        for atleta in atletas:
            # so as colunas do resultado (sem CPF), cada uma protegida
            linha = {coluna: proteger_formula(atleta[coluna]) for coluna in COLUNAS_RESULTADO}
            escritor.writerow(linha)


def main():
    """Menu do back-office: carrega, processa e mostra os resultados."""
    aprovados = []
    recusados = []

    while True:
        print('\n=== PENEIRAS ON - BACK-OFFICE ===')
        print('[1] Carregar inscricoes (CSV)')
        print('[2] Ranking')
        print('[3] Metricas da rodada')
        print('[4] Inscricoes recusadas')
        print('[5] Consultar atleta por codigo')
        print(f'[6] Exportar {ARQUIVO_RESULTADOS}')
        print('[0] Sair')
        opcao = input('> ').strip()

        if opcao in {'2', '3', '4', '5', '6'} and not (aprovados or recusados):
            print('Nenhuma inscricao carregada. Use a opcao 1 primeiro.')
        elif opcao == '1':
            # strip('"'): o "Copiar como caminho" do Windows vem entre aspas
            caminho = input('Caminho do CSV: ').strip().strip('"')
            try:
                inscricoes = carregar_inscricoes(caminho)
                aprovados, recusados = processar(inscricoes)
            except FileNotFoundError:
                print('Arquivo nao encontrado.')
            except KeyError as coluna:
                print(f'CSV fora do contrato: falta a coluna {coluna}.')
            except UnicodeDecodeError:
                # acontece se o CSV for salvo de novo pelo Excel
                print('CSV nao esta em UTF-8: baixe de novo direto da planilha.')
            else:
                aprovados = gerar_ranking(aprovados)
                print(f'{len(inscricoes)} inscricoes: {len(aprovados)} aprovadas, '
                      f'{len(recusados)} recusadas.')
        elif opcao == '2':
            mostrar_ranking(aprovados)
        elif opcao == '3':
            mostrar_metricas(calcular_metricas(aprovados, recusados))
        elif opcao == '4':
            mostrar_recusados(recusados)
        elif opcao == '5':
            codigo = input('Codigo da inscricao: ').strip()
            mostrar_consulta(aprovados, recusados, codigo)
        elif opcao == '6':
            try:
                exportar_resultados(aprovados, ARQUIVO_RESULTADOS)
            except PermissionError:
                print(f'Nao foi possivel gravar: feche o {ARQUIVO_RESULTADOS} se estiver aberto.')
            else:
                print(f'{ARQUIVO_RESULTADOS} gravado com {len(aprovados)} atletas.')
        elif opcao == '0':
            break
        else:
            print('Opcao invalida. Digite de 0 a 6.')


if __name__ == '__main__':
    main()
