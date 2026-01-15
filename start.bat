@echo off
echo ========================================
echo   INICIANDO SERVIDOR DE CERTIFICADOS
echo ========================================
echo.

echo Verificando MongoDB...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo.
    echo AVISO: MongoDB nao esta rodando!
    echo.
    echo Opcoes:
    echo 1. Instalar MongoDB: https://www.mongodb.com/try/download/community
    echo 2. Usar MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
    echo 3. Configure a URL no arquivo .env
    echo.
    echo Pressione qualquer tecla para tentar iniciar mesmo assim...
    pause >nul
)

echo.
echo Iniciando servidor na porta 5000...
echo Acesse: http://localhost:5000/login.html
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm start
