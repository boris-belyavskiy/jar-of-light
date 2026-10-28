import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createDb, createUser, type Db } from "./harness";

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

let db: Db;
let entryOfB: string;
let categoryOfB: string;
let systemCategory: string;

beforeAll(async () => {
  db = await createDb();
  await createUser(db, A, "Alice");
  await createUser(db, B, "Bob");

  systemCategory = (await db.query<{ id: string }>("select id from public.categories where slug = 'family'"))
    .rows[0].id;

  await asUser(db, B, async () => {
    categoryOfB = (
      await db.query<{ id: string }>("insert into public.categories (user_id, name) values ($1, 'Bob only') returning id", [B])
    ).rows[0].id;
    entryOfB = (
      await db.query<{ id: string }>(
        "insert into public.entries (body, occurred_on, occurred_time) values ('A secret of Bob', '2026-01-01', '10:00') returning id",
      )
    ).rows[0].id;
    await db.query("insert into public.entry_categories (entry_id, category_id) values ($1, $2)", [entryOfB, categoryOfB]);
  });
}, 60_000);

describe("profiles", () => {
  it("are created on sign-up with the Google name", async () => {
    const rows = await asUser(db, A, () => db.query<{ display_name: string }>("select display_name from public.profiles"));
    expect(rows.rows).toEqual([{ display_name: "Alice" }]);
  });

  it("cannot be changed for another user", async () => {
    const res = await asUser(db, A, () => db.query("update public.profiles set display_name = 'hacked' where id = $1", [B]));
    expect(res.affectedRows).toBe(0);
  });
});

describe("entries: user A and user B", () => {
  it("A cannot read B's entries", async () => {
    const res = await asUser(db, A, () => db.query("select * from public.entries"));
    expect(res.rows).toHaveLength(0);
  });

  it("A cannot update or delete B's entries", async () => {
    const upd = await asUser(db, A, () => db.query("update public.entries set body = 'x' where id = $1", [entryOfB]));
    const del = await asUser(db, A, () => db.query("delete from public.entries where id = $1", [entryOfB]));
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);
  });

  it("A cannot create an entry in B's name", async () => {
    await expect(
      asUser(db, A, () =>
        db.query("insert into public.entries (user_id, body, occurred_on, occurred_time) values ($1, 'x', '2026-01-01', '10:00')", [B]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("A cannot read or attach categories to B's entries", async () => {
    const read = await asUser(db, A, () => db.query("select * from public.entry_categories"));
    expect(read.rows).toHaveLength(0);
    await expect(
      asUser(db, A, () =>
        db.query("insert into public.entry_categories (entry_id, category_id) values ($1, $2)", [entryOfB, systemCategory]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("B still has the entry", async () => {
    const res = await asUser(db, B, () => db.query<{ body: string }>("select body from public.entries"));
    expect(res.rows).toEqual([{ body: "A secret of Bob" }]);
  });
});

describe("categories", () => {
  it("A sees the six system categories but not B's own", async () => {
    const res = await asUser(db, A, () => db.query<{ slug: string | null }>("select slug from public.categories order by sort"));
    expect(res.rows.map((r) => r.slug)).toEqual(["family", "friends", "work", "study", "health", "chance_encounter"]);
  });

  it("A cannot rename, delete or use B's category", async () => {
    const upd = await asUser(db, A, () => db.query("update public.categories set name = 'x' where id = $1", [categoryOfB]));
    const del = await asUser(db, A, () => db.query("delete from public.categories where id = $1", [categoryOfB]));
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);

    await expect(
      asUser(db, A, async () => {
        const e = await db.query<{ id: string }>(
          "insert into public.entries (body, occurred_on, occurred_time) values ('mine', '2026-01-02', '09:00') returning id",
        );
        await db.query("insert into public.entry_categories (entry_id, category_id) values ($1, $2)", [e.rows[0].id, categoryOfB]);
      }),
    ).rejects.toThrow(/row-level security/);
  });

  it("system categories can be hidden but not renamed or deleted", async () => {
    const upd = await asUser(db, A, () => db.query("update public.categories set sort = 99 where id = $1", [systemCategory]));
    const del = await asUser(db, A, () => db.query("delete from public.categories where id = $1", [systemCategory]));
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);

    await asUser(db, A, () => db.query("insert into public.hidden_categories (category_id) values ($1)", [systemCategory]));
    const hiddenForB = await asUser(db, B, () => db.query("select * from public.hidden_categories"));
    expect(hiddenForB.rows).toHaveLength(0);
  });

  it("deleting a custom category keeps the entries (CAT-02)", async () => {
    await asUser(db, B, () => db.query("delete from public.categories where id = $1", [categoryOfB]));
    const res = await asUser(db, B, () => db.query("select id from public.entries where id = $1", [entryOfB]));
    expect(res.rows).toHaveLength(1);
  });
});

describe("validation in the database", () => {
  it("rejects empty and over-long text", async () => {
    await expect(
      asUser(db, A, () => db.query("insert into public.entries (body, occurred_on, occurred_time) values ('   ', '2026-01-01', '10:00')")),
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(db, A, () =>
        db.query("insert into public.entries (body, occurred_on, occurred_time) values ($1, '2026-01-01', '10:00')", ["x".repeat(4001)]),
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("rejects entries in the future", async () => {
    await expect(
      asUser(db, A, () => db.query("insert into public.entries (body, occurred_on, occurred_time) values ('later', '2999-01-01', '10:00')")),
    ).rejects.toThrow(/future/);
  });

  it("anon has no access at all", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from public.entries")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
});

describe("account deletion (DATA-02)", () => {
  it("removes the profile, entries and categories", async () => {
    await db.query("delete from auth.users where id = $1", [B]);
    for (const table of ["profiles", "entries", "categories", "hidden_categories"]) {
      const col = table === "profiles" ? "id" : "user_id";
      const res = await db.query(`select 1 from public.${table} where ${col} = $1`, [B]);
      expect(res.rows, table).toHaveLength(0);
    }
  });
});
