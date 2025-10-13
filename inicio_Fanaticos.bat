@echo off
echo === Iniciando ERP System ===
echo.

REM Verificar si Docker Desktop está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker no esta corriendo. Iniciando Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Esperando a que Docker inicie...
    timeout /t 30 /nobreak
)

REM Cambiar al directorio del proyecto (ajusta la ruta)
REM cd /d C:\ruta\a\tu\proyecto

echo Levantando contenedores...
docker-compose up -d

echo Esperando a que los servicios esten listos...
timeout /t 5 /nobreak

echo.
echo Estado de los contenedores:
docker-compose ps

echo.
echo === ERP System iniciado ===
echo Accede a: http://localhost:puerto
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener: docker-compose down
echo.
pause
