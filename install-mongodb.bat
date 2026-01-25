@echo off
echo ========================================
echo Instalador do MongoDB Server
echo ========================================
echo.
echo IMPORTANTE: O MongoDB Compass ja esta instalado, mas
echo precisamos do MongoDB SERVER para o banco funcionar.
echo.
echo Opcoes:
echo 1. Usar MongoDB Atlas (Cloud - GRATIS e RAPIDO)
echo 2. Baixar MongoDB Server manualmente
echo.
echo ========================================
echo OPCAO 1 - MongoDB Atlas (Recomendado)
echo ========================================
echo.
echo 1. Acesse: https://www.mongodb.com/cloud/atlas/register
echo 2. Crie conta gratuita
echo 3. Crie cluster M0 (gratis)
echo 4. Configure usuario e senha
echo 5. Em Network Access, adicione 0.0.0.0/0
echo 6. Copie a connection string
echo 7. Cole no arquivo .env na variavel MONGODB_URI
echo.
echo ========================================
echo OPCAO 2 - MongoDB Server Local
echo ========================================
echo.
echo 1. Acesse: https://www.mongodb.com/try/download/community
echo 2. Baixe MongoDB Community Server (ZIP version)
echo 3. Extraia para E:\mongodb
echo 4. Execute: start-mongodb-local.bat
echo.
pause
start https://www.mongodb.com/cloud/atlas/register
