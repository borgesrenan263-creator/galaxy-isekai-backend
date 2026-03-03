# 🌌 Galaxy Isekai — Battle Engine

Motor de batalhas determinísticas para RPG tático, com replay completo, persistência em SQLite e API HTTP performática.

Projeto focado em **arquitetura backend profissional**, **simulação reproduzível** e **base pronta para tempo real (WebSocket)**.

---

## 🚀 Features

- ⚔️ Simulação de batalha determinística
- 🎲 Seed controlada para replays idênticos
- 💾 Persistência em SQLite
- 📜 Replay completo da batalha
- 🧠 Estrutura pronta para leaderboard
- 🔌 API REST com Fastify
- 📱 Desenvolvido 100% mobile (Termux)

---

## 🧱 Stack

- Node.js 24
- Fastify
- SQLite (better-sqlite3)
- UUID crypto.randomUUID()
- Termux (mobile dev environment)

---

## 📡 Endpoints

### ▶️ Simular batalha

POST `/battle/simulate`

```json
{
  "attacker_id": "uuid",
  "defender_id": "uuid"
}
Perfeito — vi seu print.

✅ Você está em: ~/galaxy-isekai/backend
✅ Existe package.json aqui
✅ NÃO existe README ainda → ótimo, vamos criar README nível recrutador sênior

🔥 Isso já sobe MUITO o nível do projeto.


---

🚀 PASSO 2 — Criar README técnico (VERSÃO MAX)

No Termux, rode exatamente:

cat > README.md << 'EOF'
# 🌌 Galaxy Isekai — Battle Engine

Motor de batalhas determinísticas para RPG tático, com replay completo, persistência em SQLite e API HTTP performática.

Projeto focado em **arquitetura backend profissional**, **simulação reproduzível** e **base pronta para tempo real (WebSocket)**.

---

## 🚀 Features

- ⚔️ Simulação de batalha determinística
- 🎲 Seed controlada para replays idênticos
- 💾 Persistência em SQLite
- 📜 Replay completo da batalha
- 🧠 Estrutura pronta para leaderboard
- 🔌 API REST com Fastify
- 📱 Desenvolvido 100% mobile (Termux)

---

## 🧱 Stack

- Node.js 24
- Fastify
- SQLite (better-sqlite3)
- UUID crypto.randomUUID()
- Termux (mobile dev environment)

---

## 📡 Endpoints

### ▶️ Simular batalha

POST `/battle/simulate`

```json
{
  "attacker_id": "uuid",
  "defender_id": "uuid"
}

Resposta:

winnerId

loserId

roundsCount

replay completo

battleId persistido



---

🎥 Replay da batalha

GET /battle/replay/:id

Retorna o replay salvo da batalha.


---

🧪 Rodando localmente

npm install
npm run dev

Servidor padrão:

http://127.0.0.1:3333


---

🗄️ Banco

Arquivo:

dev.db

Tabela principal:

battles

characters



---

🧠 Arquitetura

Fluxo da batalha:

simulate →
  roll →
    rounds →
      log →
        persist →
          replay

Características:

determinístico por seed

replay reproduzível

preparado para streaming futuro



---

🗺️ Roadmap

[ ] Migração para TypeScript

[ ] Testes robustos de batalha

[ ] WebSocket battle stream

[ ] Leaderboard global

[ ] Deploy público



---

👨‍💻 Autor

Renan Borges

Projeto desenvolvido como base de portfólio para backend de jogos e sistemas em tempo real.

