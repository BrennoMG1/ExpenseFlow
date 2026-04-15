@echo off
echo ============================================
echo  COPIAR DADOS EXPENSEFLOW
echo ============================================

set TEMP_FILE=%TEMP%\ExpenseFlow_Dados.xlsx
set DADOS_FILE=C:\Users\brenn\Downloads\ExpenseFlow (100 por cento atualizado)\ExpenseFlow\ExpenseFlow\Dados\ExpenseFlow_Dados.xlsx

echo.
echo [1] Verificando arquivo gerado pelo robo...
if exist "%TEMP_FILE%" (
    echo     ENCONTRADO: %TEMP_FILE%
    for %%A in ("%TEMP_FILE%") do echo     Tamanho: %%~zA bytes
) else (
    echo     NAO ENCONTRADO. Execute o robo primeiro!
    pause
    exit
)

echo.
echo [2] Copiando para pasta do backend...
copy /Y "%TEMP_FILE%" "%DADOS_FILE%"
if %errorlevel% == 0 (
    echo     COPIADO COM SUCESSO!
) else (
    echo     ERRO ao copiar!
)

echo.
echo ============================================
echo  PRONTO! Atualize a pagina no navegador.
echo ============================================
pause