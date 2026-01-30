# ========== Stage 1: Frontend build ==========
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Coolify'da Build Arguments olarak VITE_SUPABASE_URL ve VITE_SUPABASE_KEY verin
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ========== Stage 2: Backend build ==========
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend-build
WORKDIR /app

COPY MaterialManagement.sln ./
COPY src/MaterialManagement.API/MaterialManagement.API.csproj src/MaterialManagement.API/
COPY src/MaterialManagement.Models/MaterialManagement.Models.csproj src/MaterialManagement.Models/
COPY src/MaterialManagement.Services/MaterialManagement.Services.csproj src/MaterialManagement.Services/

RUN dotnet restore MaterialManagement.sln

COPY src/ ./src/
RUN dotnet publish src/MaterialManagement.API/MaterialManagement.API.csproj -c Release -o /app/publish --no-restore

# ========== Stage 3: Runtime ==========
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Coolify / cloud ortamları genelde PORT=8080 kullanır
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /app/frontend/dist ./wwwroot

ENTRYPOINT ["dotnet", "MaterialManagement.API.dll"]
