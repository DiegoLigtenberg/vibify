FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Copy project files
COPY pyproject.toml uv.lock ./

# Install dependencies with uv
RUN uv sync --frozen --no-dev

# Copy backend source
COPY . .

# Set Python path to include the app directory
ENV PYTHONPATH=/app

# Expose port (Railway uses PORT env var, local uses 8000)
EXPOSE ${PORT:-8000}

# Start the backend
CMD ["uv", "run", "python", "start_production.py"]
