import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createDb, createUser, type Db } from "./harness";

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

/**
 * The required data isolation test. Two users, the real migrations and the real
 * Row Level Security policies: what one user writes, the other cannot see.
 */
describe("data isolation between two users", () => {
  let db: Db;

  beforeAll(async () => {
    db = await createDb();
    await createUser(db, A, "Alice");
    await createUser(db, B, "Bob");
    await asUser(db, A, async () => {
      const { rows } = await db.query<{ id: string }>(
        "insert into public.entries (body, occurred_on, occurred_time) values ('A private moment', '2026-11-01', '21:00') returning id",
      );
      await db.query("insert into public.stars (entry_id) values ($1)", [rows[0].id]);
    });
  }, 60_000);

  it("given A has an entry and a star, when B reads entries and stars, then B gets zero rows", async () => {
    await asUser(db, B, async () => {
      expect((await db.query("select * from public.entries")).rows).toEqual([]);
      expect((await db.query("select * from public.stars")).rows).toEqual([]);
    });
  });

  it("given the same data, when A reads entries and stars, then A still gets both", async () => {
    await asUser(db, A, async () => {
      expect((await db.query("select * from public.entries")).rows).toHaveLength(1);
      expect((await db.query("select * from public.stars")).rows).toHaveLength(1);
    });
  });
});
