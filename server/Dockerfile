# Utiliser une image de base Python 3.8
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances dans le conteneur
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code dans le conteneur
COPY . .

# Exposer le port sur lequel l'application s'exécute
EXPOSE 8000

# Définir la commande pour exécuter l'application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]