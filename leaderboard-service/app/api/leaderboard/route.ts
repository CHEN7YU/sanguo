import { and, asc, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../db";
import { scores } from "../../../db/schema";

export const runtime = "edge";

const GAME_ORIGIN = "https://sanguozhi-zhaoliezhuan-test.fanduanyang.chatgpt.site";
const LOCAL_ORIGINS = new Set(["http://127.0.0.1:4173", "http://localhost:4173"]);
const RULE_VERSION = 1;
const levelRules = {
  "sishui-pass": { name: "汜水关之战", targetSeconds: 600, targetTurns: 12, maxTurns: 30 },
  "hulao-pass": { name: "虎牢关之战", targetSeconds: 900, targetTurns: 15, maxTurns: 30 },
  guangchuan: { name: "广川之战", targetSeconds: 720, targetTurns: 14, maxTurns: 30 },
  xindu: { name: "信都之战", targetSeconds: 780, targetTurns: 15, maxTurns: 30 },
  julu: { name: "巨鹿之战", targetSeconds: 900, targetTurns: 16, maxTurns: 30 },
  qinghe: { name: "清河之战", targetSeconds: 840, targetTurns: 15, maxTurns: 30 },
} as const;

type LevelId = keyof typeof levelRules;

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = origin === GAME_ORIGIN || LOCAL_ORIGINS.has(origin) ? origin : GAME_ORIGIN;
  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(request: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculateScore(input: {
  levelId: LevelId;
  elapsedMs: number;
  turns: number;
  lossPercent: number;
  retreatCount: number;
  victoryType: "normal" | "duel" | "alternate";
}) {
  const rule = levelRules[input.levelId];
  const seconds = Math.max(1, Math.round(input.elapsedMs / 1000));
  const safeTurns = clamp(Math.round(input.turns), 1, rule.maxTurns);
  const loss = clamp(input.lossPercent, 0, 100);
  const timeRatio = clamp(1 - Math.max(0, seconds - rule.targetSeconds) / (rule.targetSeconds * 2), 0, 1);
  const turnRatio = clamp(1 - Math.max(0, safeTurns - rule.targetTurns) / Math.max(1, rule.maxTurns - rule.targetTurns), 0, 1);
  const timeScore = Math.round(2500 * timeRatio);
  const turnScore = Math.round(3000 * turnRatio);
  const preservationScore = Math.round(3500 * (1 - loss / 100));
  const bonusScore = (input.retreatCount === 0 ? 400 : 0)
    + (input.victoryType === "duel" ? 350 : 0)
    + (seconds <= rule.targetSeconds && safeTurns <= rule.targetTurns ? 250 : 0);
  const score = clamp(timeScore + turnScore + preservationScore + bonusScore, 0, 10000);
  const grade = score >= 9000 ? "S" : score >= 8000 ? "A" : score >= 6500 ? "B" : score >= 5000 ? "C" : "D";
  return { score, grade };
}

function publicEntry(row: typeof scores.$inferSelect) {
  return {
    nickname: row.nickname,
    levelId: row.levelId,
    levelName: row.levelName,
    score: row.score,
    grade: row.grade,
    elapsedMs: row.elapsedMs,
    turns: row.turns,
    lossPercent: row.lossTenths / 10,
    retreatCount: row.retreats,
    victoryType: row.victoryType,
    updatedAt: row.updatedAt,
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const levelId = request.nextUrl.searchParams.get("level") as LevelId | null;
  if (!levelId || !(levelId in levelRules)) return json(request, { error: "未知关卡" }, 400);

  const rows = await getDb()
    .select()
    .from(scores)
    .where(eq(scores.levelId, levelId))
    .orderBy(desc(scores.score), asc(scores.elapsedMs), asc(scores.turns), asc(scores.updatedAt))
    .limit(50);
  return json(request, { levelId, levelName: levelRules[levelId].name, entries: rows.map(publicEntry) });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "战绩数据格式错误" }, 400);
  }

  const levelId = String(body.levelId || "") as LevelId;
  if (!(levelId in levelRules)) return json(request, { error: "未知关卡" }, 400);
  const playerId = String(body.playerId || "").trim().slice(0, 80);
  const nickname = String(body.nickname || "")
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 16);
  const elapsedMs = Math.round(Number(body.elapsedMs));
  const turns = Math.round(Number(body.turns));
  const lossPercent = Number(body.lossPercent);
  const retreatCount = Math.round(Number(body.retreatCount));
  const victoryType = String(body.victoryType || "normal") as "normal" | "duel" | "alternate";
  const rule = levelRules[levelId];

  if (playerId.length < 8 || nickname.length < 2) return json(request, { error: "玩家信息无效" }, 400);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 1000 || elapsedMs > 8 * 60 * 60 * 1000) return json(request, { error: "战斗时间无效" }, 400);
  if (!Number.isFinite(turns) || turns < 1 || turns > rule.maxTurns) return json(request, { error: "回合数无效" }, 400);
  if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent > 100) return json(request, { error: "损失数据无效" }, 400);
  if (!Number.isFinite(retreatCount) || retreatCount < 0 || retreatCount > 20) return json(request, { error: "撤退数据无效" }, 400);
  if (!["normal", "duel", "alternate"].includes(victoryType)) return json(request, { error: "胜利类型无效" }, 400);

  const calculated = calculateScore({ levelId, elapsedMs, turns, lossPercent, retreatCount, victoryType });
  const db = getDb();
  const [existing] = await db
    .select()
    .from(scores)
    .where(and(eq(scores.playerId, playerId), eq(scores.levelId, levelId)))
    .limit(1);
  const improved = !existing
    || calculated.score > existing.score
    || (calculated.score === existing.score && elapsedMs < existing.elapsedMs);

  if (!existing) {
    await db.insert(scores).values({
      playerId,
      nickname,
      levelId,
      levelName: rule.name,
      score: calculated.score,
      grade: calculated.grade,
      elapsedMs,
      turns,
      lossTenths: Math.round(lossPercent * 10),
      retreats: retreatCount,
      victoryType,
      ruleVersion: RULE_VERSION,
    });
  } else if (improved) {
    await db
      .update(scores)
      .set({
        nickname,
        score: calculated.score,
        grade: calculated.grade,
        elapsedMs,
        turns,
        lossTenths: Math.round(lossPercent * 10),
        retreats: retreatCount,
        victoryType,
        ruleVersion: RULE_VERSION,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scores.id, existing.id));
  }

  const ranked = await db
    .select()
    .from(scores)
    .where(eq(scores.levelId, levelId))
    .orderBy(desc(scores.score), asc(scores.elapsedMs), asc(scores.turns), asc(scores.updatedAt));
  const saved = ranked.find((entry) => entry.playerId === playerId);
  if (!saved) return json(request, { error: "保存战绩失败" }, 500);
  return json(request, { entry: publicEntry(saved), rank: ranked.indexOf(saved) + 1, improved });
}
