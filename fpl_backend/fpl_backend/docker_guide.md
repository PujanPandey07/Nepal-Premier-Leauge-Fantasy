# Docker Commands Reference — NPL Fantasy Cricket

A lookup of every Docker command used while dockerizing the Django + Postgres + Celery backend, with the reasoning behind each one.

---

## Build

### Build the Django image

```bash
docker build -t npl-django .
```

- `docker build` — reads the Dockerfile in the current directory and produces an image
- `-t npl-django` — tags the image with a human-readable name instead of a random ID
- `.` — the **build context**: the folder Docker looks in for the Dockerfile and any `COPY`-referenced files (also what `.dockerignore` filters)

Run this any time you change the Dockerfile **or** any file that gets `COPY`'d in (i.e. your actual code) — an image is a frozen snapshot, editing source files on disk does nothing to an already-built image.

---

## Run — Django

### Run Django alone (no network, no env — for isolated testing only)

```bash
docker run -p 8000:8000 npl-django
```

- `-p 8000:8000` — maps port 8000 on your machine (host) to port 8000 inside the container, format is `host:container`. Without this, the container is sealed off from your browser entirely.

### Run Django fully wired (network + env vars)

```bash
docker run -p 8000:8000 --network npl-network --env-file ../.env npl-django
```

- `--network npl-network` — attaches the container to our custom network so it can resolve other containers (like `postgres`) by name
- `--env-file ../.env` — loads every `KEY=value` line from the `.env` file as environment variables inside the container. Path is relative to wherever you run the command from — ours sits one level up from `fpl_backend/`.

**Why this is needed at all:** a container is an isolated machine with its own `localhost` and no environment variables of its own. Nothing from your local `.env` or your Windows machine reaches it unless explicitly passed in.

---

## Run — one-off / inspection commands

### Dump all env vars a container would receive (debugging)

```bash
docker run --rm --env-file ../.env npl-django env
```

- `--rm` — deletes the container automatically once the command finishes (we don't need to keep it around, just want the output)
- `env` — overrides the Dockerfile's default `CMD` for this run only, running the Linux `env` command instead of `runserver`. Prints every environment variable — used to confirm `.env` values are actually reaching the container before debugging further.

### Run Django migrations against the containerized Postgres

```bash
docker run --rm --network npl-network --env-file ../.env npl-django python manage.py migrate
```

- Same override trick — `python manage.py migrate` replaces the default `CMD`, creates all tables, then the container exits and deletes itself (`--rm`).

---

## Run — Celery

### Start a Celery worker (same image as Django, different command)

```bash
docker run --network npl-network --env-file ../.env npl-django celery -A fpl_backend worker -l info
```

- No `-p` flag — Celery doesn't serve HTTP, nothing needs to reach it from a browser
- `npl-django celery -A fpl_backend worker -l info` — overrides the default `CMD`; `-A fpl_backend` points Celery at the Django project with the Celery app config, `worker` starts worker mode, `-l info` sets log verbosity

**Why no separate Dockerfile:** Celery runs the exact same codebase/dependencies as Django — same image, just a different startup command.

---

## Postgres container (official image, no Dockerfile needed)

### Create the shared network first

```bash
docker network create npl-network
```

- Registers a custom network. Containers attached to the same network can reach each other **by container name**, resolved like DNS — this is what replaces `localhost` between containers.

### Run Postgres, detached, on that network

```bash
docker run -d --name postgres --network npl-network -e POSTGRES_DB=npl_fantasy -e POSTGRES_USER=npl_user -e POSTGRES_PASSWORD=1717pujan -v postgres_data:/var/lib/postgresql/data postgres:16-alpine
```

- `-d` — detached; runs in the background instead of occupying the terminal
- `--name postgres` — **this exact name is what other containers use as the hostname to reach it** (e.g. Django's `DB_HOST=postgres`)
- `--network npl-network` — same network as Django/Celery
- `-e POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD` — the official Postgres image reads these on first boot to auto-create a database, user, and password
- `-v postgres_data:/var/lib/postgresql/data` — a **volume**, maps Postgres's internal data directory to a named volume on your machine so data survives container deletion (without this, deleting the container wipes the database)
- `postgres:16-alpine` — official Postgres image, version 16, lightweight Alpine Linux base

**Why no Dockerfile:** we're not customizing anything — the stock official image already does exactly what we need. Dockerfiles are only for when you need to _change_ what's inside a base image (which is why Django needed one — its own code had to go in).

---

## Inspection / general utility

### List running containers

```bash
docker ps
```

Confirms a container is actually up, shows its name, status, and ports. Essential after any `-d` (detached) run since there's no live log output to eyeball.

### Run a command inside an already-running container

```bash
docker exec postgres env
```

- `docker exec` — runs a new command inside a container that's already running (as opposed to `docker run`, which starts a fresh container)
- Used here to confirm Postgres's own env vars were set correctly, independent of Django's side

### Show hidden files (find `.env` on Windows/PowerShell)

```bash
dir -Force
```

`-Force` reveals dotfiles that a plain `dir` hides in PowerShell.

---

## Key concepts recap

| Concept                            | What it means                                                                                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Image vs container**             | Image = frozen recipe; container = a running instance of it. Rebuild the image after every code change.                                                                                                                                |
| **Layer caching**                  | Docker caches each Dockerfile step; order `COPY requirements.txt` + install _before_ `COPY . .` so code changes don't force a full package reinstall.                                                                                  |
| **`WORKDIR`**                      | Sets the "current folder" inside the container for all subsequent instructions.                                                                                                                                                        |
| **`0.0.0.0` vs `127.0.0.1`**       | Inside a container, binding to `127.0.0.1`/`localhost` only accepts connections from inside that same container. `0.0.0.0` accepts from anywhere, letting `-p` port mapping actually work.                                             |
| **`localhost` inside a container** | Always means "this container," never your host machine or another container. This is why raw `docker run` couldn't reach a locally-installed Postgres.                                                                                 |
| **Custom Docker network**          | Containers on the same `--network` can resolve each other **by container name**, like built-in DNS. This is what replaces `localhost` for container-to-container communication.                                                        |
| **`--env-file`**                   | Injects variables from a file into the container's environment at runtime — does **not** bake them into the image, and does **not** strip quote characters (unlike some Python env-loading libraries), so keep `.env` values unquoted. |
| **`CMD` override**                 | Anything typed after the image name in `docker run` replaces the Dockerfile's default `CMD` for that run only — this is how one image (`npl-django`) runs as both the Django server and the Celery worker.                             |
| **Volumes**                        | Map a container's internal data directory to storage that persists outside the container's lifecycle — required for databases, or data is lost on every `docker rm`.                                                                   |
| **PowerShell line continuation**   | Use `` ` `` (backtick), not `\` — `\` causes a parser error in PowerShell.                                                                                                                                                             |

---

## Still ahead (tomorrow)

- React Dockerfile (multi-stage build: Node build stage → Nginx serve stage)
- Nginx reverse proxy config
- Docker Compose — collapsing every command above into a single `docker-compose.yml`, replacing manual `docker network create` + multiple `docker run` commands with `docker compose up`
