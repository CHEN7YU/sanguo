import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const scores = sqliteTable(
  "scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: text("player_id").notNull(),
    nickname: text("nickname").notNull(),
    levelId: text("level_id").notNull(),
    levelName: text("level_name").notNull(),
    score: integer("score").notNull(),
    grade: text("grade").notNull(),
    elapsedMs: integer("elapsed_ms").notNull(),
    turns: integer("turns").notNull(),
    lossTenths: integer("loss_tenths").notNull(),
    retreats: integer("retreats").notNull(),
    victoryType: text("victory_type").notNull(),
    ruleVersion: integer("rule_version").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("scores_player_level_unique").on(table.playerId, table.levelId)]
);
