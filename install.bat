@echo off
echo ========================================
echo   GERADOR DE CERTIFICADOS - INSTALACAO
echo ========================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js instalado!
echo.

echo [2/3] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)
echo OK - Dependencias instaladas!
echo.

echo [3/3] Verificando MongoDB...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo AVISO: MongoDB nao encontrado localmente!
    echo.
    echo Voce tem 2 opcoes:
    echo.
    echo 1. INSTALAR MONGODB LOCAL (Recomendado para desenvolvimento)
    echo    Download: https://www.mongodb.com/try/download/community
    echo.
    echo 2. USAR MONGODB ATLAS (Cloud - Gratis)
    echo    Crie uma conta: https://www.mongodb.com/cloud/atlas
    echo    Depois cole a connection string no arquivo .env
    echo.
    echo Pressione qualquer tecla para continuar mesmo assim...
    pause >nul
) else (
    echo OK - MongoDB encontrado!
)

echo.
echo ========================================
echo   INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o servidor, execute:
echo   npm start
echo.
echo Depois acesse: http://localhost:5000/login.html
echo.
pause
