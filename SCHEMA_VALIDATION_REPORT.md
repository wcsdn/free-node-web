# Database Schema Validation Report
Generated: 2026-02-08 19:44 GMT+8

## Executive Summary
Analyzed schema files and route implementations for ghost-game and ghost-core workers.

---

## ✅ Tables Defined in Schema (36 tables)

### Core Game Tables (ghost-game/schema.sql)
| Table | Status | Notes |
|-------|--------|-------|
| characters | ✅ | Player wallet-based profile |
| cities | ✅ | City management |
| buildings | ✅ | City buildings |
| heroes | ✅ | Hero units |
| items_config | ✅ | Item configuration |
| items | ✅ | Player inventory |
| corps | ✅ | Army corps |
| troops | ✅ | Military units |
| battles | ✅ | Battle records |
| city_defenses | ✅ | City defense facilities |
| mails | ✅ | Mail system |
| guilds | ✅ | Guild system |
| guild_members | ✅ | Guild membership |
| tasks | ✅ | Task tracking |
| time_events | ✅ | Time-based events |

### Extended System Tables
| Table | Status | Notes |
|-------|--------|-------|
| chat_messages | ✅ | Chat system |
| skills | ✅ | Player skills |
| hero_skills | ✅ | Hero-specific skills |
| persist_effects | ✅ | Persistent effects |
| defence_buildings | ✅ | Defense buildings |
| technics | ✅ | Technology/research |
| corps_system | ✅ | Corps system (v2) |
| corps_members | ✅ | Corps membership |
| corps_heroes | ✅ | Corps hero assignments |
| help_categories | ✅ | Help system |
| help_articles | ✅ | Help articles |
| daily_signin | ✅ | Daily sign-in rewards |
| daily_task_configs | ✅ | Daily task config |
| daily_task_progress | ✅ | Daily task progress |
| notifications | ✅ | System notifications |
| user_notifications | ✅ | User notification links |
| activity_rewards_claimed | ✅ | Activity reward claims |
| map_explored | ✅ | Exploration tracking |
| city_movements | ✅ | City movement logs |
| festival_progress | ✅ | Festival event progress |
| daily_activity | ✅ | Daily activity records |

### Ghost Core Tables
| Table | Status | Notes |
|-------|--------|-------|
| users | ✅ | User central system |
| daily_usage | ✅ | Daily usage stats |
| quests | ✅ | Quest definitions |
| user_quests | ✅ | User quest progress |
| achievements | ✅ | Achievement definitions |
| user_achievements | ✅ | User achievements |
| exchange_activities | ✅ | Exchange activities |
| page_views | ✅ | Page view statistics |

---

## ❌ Missing Tables (Referenced in Code but NOT in Schema)

| Table | Used In | Risk |
|-------|---------|------|
| **arena_records** | battle.ts, arena.ts | HIGH - Runtime errors |
| **dungeons** | battle.ts | HIGH - PVE feature broken |
| **dungeon_progress** | battle.ts | HIGH - Dungeon progress lost |
| **dungeon_records** | battle.ts | HIGH - Dungeon history lost |
| **building_configs** | building.ts | MEDIUM - May be config JSON |
| **inventory** | item.ts, item-craft.ts | HIGH - Uses `inventory` table instead of `items` |

---

## ⚠️ Schema Inconsistencies Found

### 1. Table Name Mismatch: `items` vs `inventory`
```sql
-- Code uses:
INSERT INTO inventory (wallet_address, item_id, count)
SELECT * FROM inventory WHERE wallet_address = ?
UPDATE inventory SET count = count - ?

-- Schema defines:
CREATE TABLE items (...)
```

### 2. Missing Columns in Schema
| Table | Missing Column | Used In |
|-------|---------------|---------|
| arena_records | wallet_address, opponent_address, opponent_name, result, reward, rounds | battle.ts |
| dungeons | id, stage_id, difficulty, rewards | battle.ts |
| dungeon_progress | wallet_address, dungeon_id, progress | battle.ts |
| dungeon_records | wallet_address, dungeon_id, stage_id, city_id, result, rounds, exp, gold | battle.ts |

---

## 🔧 SQL Statements to Fix Issues

### Create Missing Tables

```sql
-- Arena Records Table
CREATE TABLE IF NOT EXISTS arena_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  opponent_address TEXT,
  opponent_name TEXT,
  result TEXT NOT NULL,
  reward INTEGER DEFAULT 0,
  rounds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arena_wallet ON arena_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_arena_created ON arena_records(created_at);

-- Dungeons Configuration Table
CREATE TABLE IF NOT EXISTS dungeons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  stage_id INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1,
  description TEXT,
  enemy_config TEXT,
  exp_reward INTEGER DEFAULT 0,
  gold_reward INTEGER DEFAULT 0,
  min_power INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dungeon Progress Table
CREATE TABLE IF NOT EXISTS dungeon_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  dungeon_id INTEGER NOT NULL,
  current_stage INTEGER DEFAULT 1,
  stars INTEGER DEFAULT 0,
  last_attempt DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, dungeon_id)
);

CREATE INDEX IF NOT EXISTS idx_dungeon_progress_wallet ON dungeon_progress(wallet_address);

-- Dungeon Records Table
CREATE TABLE IF NOT EXISTS dungeon_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  dungeon_id INTEGER NOT NULL,
  stage_id INTEGER DEFAULT 1,
  city_id INTEGER,
  result TEXT NOT NULL,
  rounds INTEGER DEFAULT 0,
  exp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dungeon_records_wallet ON dungeon_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_dungeon_records_created ON dungeon_records(created_at);

-- Building Configs Table (if not in JSON config)
CREATE TABLE IF NOT EXISTS building_configs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  cost_resources TEXT,
  production TEXT,
  defense INTEGER DEFAULT 0,
  description TEXT
);
```

### Migration Script for `items` → `inventory` Consistency

**Option A**: Rename all SQL queries to use `items` table (Recommended)

**Option B**: Create `inventory` as alias view:
```sql
CREATE VIEW IF NOT EXISTS inventory AS SELECT * FROM items;
```

---

## 📊 D1 Database Status

| Database | ID | Status |
|----------|-----|--------|
| ghost-game-db | dd1e2677-5330-4681-ae87-b915e6631341 | Configured |
| ghost-core-db | 647bab8b-f789-4298-a653-3bdd9a3ea592 | Configured |
| ghost-mail-db | cc8390e3-c42a-4484-9e75-0789b38ec863 | Configured |

### Local D1 Initialization
```bash
# Initialize D1 database locally
cd workers/ghost-game
npx wrangler d1 execute ghost-game-db --local --file=./schema.sql

cd workers/ghost-core
npx wrangler d1 execute ghost-core-db --local --file=./schema.sql
```

---

## 🎯 Priority Actions

### HIGH PRIORITY
1. **Create missing tables**: arena_records, dungeons, dungeon_progress, dungeon_records
2. **Fix table name inconsistency**: `inventory` vs `items`

### MEDIUM PRIORITY
3. Verify building_configs is JSON config or create DB table
4. Add foreign key indexes where missing

### LOW PRIORITY
5. Add data migration for existing `items` → `inventory` conversion if needed
6. Document schema version and changes

---

## 📝 Code Changes Required

### Files to Update:
- `workers/ghost-game/src/routes/battle.ts` - Verify table names
- `workers/ghost-game/src/routes/item.ts` - Check `inventory` usage
- `workers/ghost-game/src/routes/item-craft.ts` - Check `inventory` usage
- `workers/ghost-game/src/routes/arena.ts` - Table references
