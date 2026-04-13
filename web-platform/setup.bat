@echo off
chcp 65001 >nul
title ExpenseFlow 2.0 — Setup

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      ExpenseFlow 2.0  —  Setup           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── 1. Verifica Python ────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Python nao encontrado.
    echo  Instale em: https://www.python.org/downloads/
    echo  IMPORTANTE: marque "Add Python to PATH" durante a instalacao!
    pause
    exit /b 1
)
echo  [OK] Python encontrado.

:: ── 2. Instala dependências ───────────────────────────
echo.
echo  [1/3] Instalando dependencias Python...
pip install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas.

:: ── 3. Cria .env se não existir ───────────────────────
echo.
echo  [2/3] Verificando arquivo .env...

if not exist backend\.env (
    echo  Arquivo .env nao encontrado. Vamos criar agora.
    echo.
    echo  Cole os valores abaixo. Pressione ENTER para usar o padrao.
    echo  (Voce pode editar o arquivo backend\.env depois)
    echo.

    set /p ORCHESTRATOR_URL="  URL do Orchestrator [https://cloud.uipath.com]: "
    if "%ORCHESTRATOR_URL%"=="" set ORCHESTRATOR_URL=https://cloud.uipath.com

    set /p UIPATH_ORG="  Nome da Organizacao UiPath (ex: expenseflow): "
    set /p UIPATH_TENANT="  Nome do Tenant UiPath (ex: DefaultTenant): "
    set /p UIPATH_CLIENT_ID="  Client ID (App Registration): "
    set /p UIPATH_CLIENT_SECRET="  Client Secret: "
    set /p UIPATH_FOLDER_ID="  Folder ID [7706458]: "
    if "%UIPATH_FOLDER_ID%"=="" set UIPATH_FOLDER_ID=7706458

    set /p UIPATH_PROCESS_NAME="  Nome do Processo [ExpenseFlow]: "
    if "%UIPATH_PROCESS_NAME%"=="" set UIPATH_PROCESS_NAME=ExpenseFlow

    echo.
    echo  Quantas contas Gmail deseja cadastrar?
    set /p NUM_CONTAS="  Numero de contas [1]: "
    if "%NUM_CONTAS%"=="" set NUM_CONTAS=1

    (
        echo ORCHESTRATOR_URL=%ORCHESTRATOR_URL%
        echo UIPATH_ORG=%UIPATH_ORG%
        echo UIPATH_TENANT=%UIPATH_TENANT%
        echo UIPATH_CLIENT_ID=%UIPATH_CLIENT_ID%
        echo UIPATH_CLIENT_SECRET=%UIPATH_CLIENT_SECRET%
        echo UIPATH_FOLDER_ID=%UIPATH_FOLDER_ID%
        echo UIPATH_PROCESS_NAME=%UIPATH_PROCESS_NAME%
        echo.
        echo # Contas de e-mail (adicione mais seguindo o padrao CONTA_N_LABEL / CONTA_N_ID)
    ) > backend\.env

    set /a MAX_CONTAS=%NUM_CONTAS%
    for /l %%n in (1,1,%MAX_CONTAS%) do (
        echo.
        echo  -- Conta %%n --
        set /p "LABEL%%n=  E-mail da conta %%n: "
        set /p "CONNID%%n=  Connection ID da conta %%n (do Orchestrator): "
        call echo CONTA_%%n_LABEL=%%LABEL%%n%% >> backend\.env
        call echo CONTA_%%n_ID=%%CONNID%%n%% >> backend\.env
    )

    echo.
    echo  [OK] Arquivo backend\.env criado com sucesso!
) else (
    echo  [OK] Arquivo .env ja existe, pulando criacao.
)

:: ── 4. Inicia o servidor ──────────────────────────────
echo.
echo  [3/3] Iniciando servidor...
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  Acesse: http://localhost:8000           ║
echo  ║  Para parar: feche esta janela           ║
echo  ╚══════════════════════════════════════════╝
echo.

cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload