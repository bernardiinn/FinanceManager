
# 🚀 Git Flow Guide – controle-cartoes

This project follows a lightweight but powerful **Git workflow** designed for full-stack apps deployed on a VM, with support for future production and domain-based access.

---

## 🧱 Branch Structure

```
main         ← Always reflects production-ready, VM-deployed code
│
├── dev      ← Latest tested development branch
│   ├── feature/...   ← New features (frontend/backend)
│   ├── bugfix/...    ← Specific bug fixes
│   └── hotfix/...    ← Critical emergency fixes to production
```

---

## 🔁 Workflow

### 1. Create a Feature Branch

```bash
git checkout dev
git checkout -b feature/your-feature-name
```

### 2. Work and Commit

```bash
git add .
git commit -m "feat: add your feature"
```

### 3. Merge into Dev

```bash
git checkout dev
git merge feature/your-feature-name
```

### 4. Deploy to VM via Main

```bash
git checkout main
git merge dev
git push origin main
```

On your VM:

```bash
git pull origin main
npm install
npm run build  # frontend
npm start      # backend
```

---

## 🔖 Tagging Releases (optional but recommended)

```bash
git tag -a v0.1-initial -m "Initial deployment to VM"
git push origin v0.1-initial
```

---

## ✅ Commit Message Format (Conventional Commits)

- `feat:` New feature
- `fix:` Bug fix
- `chore:` Maintenance or config updates
- `refactor:` Internal code changes
- `docs:` Documentation only

Example:
```bash
git commit -m "fix: handle session expiration properly"
```

---

## ✅ Summary

- Use `dev` as your active dev branch
- Use `main` for production deployment
- Create small feature branches per task
- Keep `main` clean and stable
