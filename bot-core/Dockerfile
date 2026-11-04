FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8090
# Render/Railway inyectan PORT. El esquema "bot" se crea una vez con:  python -m bot_core.migrate
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
