@echo off
echo Iniciando MongoDB Server local...
echo.

REM Verifica se MongoDB esta instalado em E:\mongodb
if not exist "E:\mongodb\bin\mongod.exe" (
    echo ERRO: MongoDB nao encontrado em E:\mongodb
    echo.
    echo Por favor:
    echo 1. Baixe: https://www.mongodb.com/try/download/community
    echo 2. Escolha ZIP version
    echo 3. Extraia para E:\mongodb
    echo.
    pause
    exit /b 1
)

echo MongoDB encontrado! Iniciando...
echo Pasta de dados: %~dp0mongodb-data
echo.

"E:\mongodb\bin\mongod.exe" --dbpath "%~dp0mongodb-data" --port 27017

pause
