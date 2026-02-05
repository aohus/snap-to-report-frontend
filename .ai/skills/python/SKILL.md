# .ai/skills/python/SKILL.md

## 0. Project Identity & Role

- **Role:** Elite Python Backend Engineer & DevOps Specialist.
- **Goal:** Build a high-performance, maintainable, and containerized **Autonomous Agent Service**.
- **Core Principle:** Clean Code, Asynchronous First, Strict Type Safety, and "Guard Clause" Logic.

## 1. Technology Stack (Strict Implementation)

### Runtime & Dependency Management

- **Language:** **Python 3.12** (Strictly enforced).
- **Manager:** **Poetry** (Single source of truth: `pyproject.toml`).
- **Installer:** **UV** (`uv pip` or poetry configured with UV) for ultra-fast installation.
- **Isolation:** Always use Virtual Environments (`venv`).

### Backend Framework Ecosystem

- **Core:** **FastAPI** (Latest).
- **Validation:** **Pydantic v2** (Use `model_validate`, `ConfigDict`).
- **Database:** **SQLAlchemy 2.0+** (Async) + **Alembic** (Migrations).
- **Mandatory Libraries:**
  - **Auth:** `fastapi-users` (User Management), `fastapi-jwt-auth` (JWT).
  - **Utils:** `fastapi-mail` (Email), `fastapi-pagination` (Pagination).
  - **Performance:** `fastapi-cache2` (Caching), `fastapi-limiter` (Rate Limiting).

### Infrastructure & DevOps

- **Docker:** Multi-stage builds for security.
- **Orchestration:** Use `docker compose` (Space, NO dash).
- **Cache/Store:** Redis (via `redis-py` async).

### Data Persistence (Async Only)

- **Database:** PostgreSQL.
- **ORM:** **SQLAlchemy 2.0+** (Asyncio Extension).
  - _Pattern:_ Repository Pattern with Unit of Work (UoW).
  - _Queries:_ strictly `select()`, `insert()`, `update()`, `delete()`.
- **Migrations:** **Alembic** (Async configuration).

## 2. Coding Standards & Logic Flow

### General Python (`**/*.py`)

- **Functional Style:** Avoid classes where possible. Use `def` for pure functions and `async def` for I/O.
- **Naming:** Lowercase with underscores for directories and files (`routers/user_routes.py`).
- **Variable Naming:** Descriptive with auxiliary verbs (e.g., `is_active`, `has_permission`).
- **RORO Pattern:** Receive an Object, Return an Object.
- **Explicit Exports:** Use `__all__` in `__init__.py` to define public API boundaries.

### Modern Python & Typing

- **No `Optional`/`Union`:** Use `str | None` and `str | int`.
- **Type Hints:** Mandatory for all function signatures.
- **Validation:** Prefer Pydantic models over raw dictionaries.

### Error Handling & Control Flow (Crucial)

- **Guard Clauses:** Handle errors/edge cases at the _beginning_ of the function.
- **Early Return:** Return immediately on failure. Avoid deep `else` nesting.
- **Happy Path Last:** The main logic should be at the very end of the function (unindented).

```python
# Implementation Example
async def get_user_profile(user_data: UserRequest) -> UserResponse:
    # 1. Guard Clauses
    if not user_data.id:
        raise ValidationError(detail="User ID is required")

    user = await repository.fetch_user(user_data.id)
    if not user:
        raise NotFoundError(detail="User not found")

    # 2. Happy Path Last
    return UserResponse.model_validate(user)
```

3. Development Protocol

Step 1: Setup & Check

- Verify pyproject.toml. Install missing dependencies via Poetry/UV.

Step 2: Implementation Workflow

- Schema First: Define Pydantic models in schemas/.
- Test First: Create a unit test in tests/ covering Edge Cases first.
- Logic: Write Async Service using Guard Clauses.
- Route: Expose via FastAPI Router using Annotated dependencies.
- Migration: poetry run alembic revision --autogenerate -m "describe_change".

4. Quality Assurance (Testing & Linting)

Linting & Formatting (Strict)

- Tool: Ruff (Linter & Formatter).
- Type Checking: Mypy (Strict mode).
- Command: ruff check ., ruff format ., mypy ..
