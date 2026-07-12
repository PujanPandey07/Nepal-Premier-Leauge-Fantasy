# Base image: lightweight Python 3.12 on Debian
FROM python:3.12-slim
# All following commands run relative to /app inside the container
WORKDIR /app

# Install system-level build tools + Postgres client headers.
# build-essential = gcc + standard C headers + make (needed to
# compile psycopg2's C extension).
# libpq-dev = pg_config + Postgres client headers.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first so Docker can cache this layer
# separately from our source code (which changes far more often)
COPY requirements.txt .
# Install dependencies inside the image
RUN pip install --no-cache-dir -r requirements.txt
# Now copy the rest of the project code (respecting .dockerignore)
COPY . .
#Start Django's dev server, bound to 0.0.0.0 so it's reachable
# from outside the container (not just 127.0.0.1)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]