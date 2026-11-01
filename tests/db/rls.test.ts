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
      await db.query<{ id: string }>("insert into public.categories (user_id, name_en) values ($1, 'Bob only') returning id", [B])
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

  it("keep each user's category order to themselves", async () => {
    await asUser(db, A, () => db.query("update public.profiles set category_order = array[$1::uuid]", [systemCategory]));
    const own = await asUser(db, A, () => db.query<{ category_order: string[] }>("select category_order from public.profiles"));
    const other = await asUser(db, A, () =>
      db.query("update public.profiles set category_order = '{}' where id = $1", [B]),
    );
    expect(own.rows[0].category_order).toEqual([systemCategory]);
    expect(other.affectedRows).toBe(0);
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
    const upd = await asUser(db, A, () => db.query("update public.categories set name_en = 'x' where id = $1", [categoryOfB]));
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

  it("a user names system categories for themselves only", async () => {
    await asUser(db, A, () =>
      db.query("insert into public.category_names (category_id, name_ru, name_en) values ($1, 'Родные', 'Kin')", [
        systemCategory,
      ]),
    );
    const own = await asUser(db, A, () => db.query<{ name_en: string }>("select name_en from public.category_names"));
    const forB = await asUser(db, B, () => db.query("select * from public.category_names"));
    const changedByB = await asUser(db, B, () =>
      db.query("update public.category_names set name_en = 'x' where user_id = $1", [A]),
    );
    expect(own.rows).toEqual([{ name_en: "Kin" }]);
    expect(forB.rows).toHaveLength(0);
    expect(changedByB.affectedRows).toBe(0);
  });

  it("category_names cannot point at a custom category or carry no name", async () => {
    await expect(
      asUser(db, A, () =>
        db.query("insert into public.category_names (category_id, name_en) values ($1, 'Mine now')", [categoryOfB]),
      ),
    ).rejects.toThrow(/row-level security/);
    const ownCustom = await asUser(db, A, () =>
      db.query<{ id: string }>("insert into public.categories (user_id, name_ru) values ($1, 'Прогулки') returning id", [A]),
    );
    await expect(
      asUser(db, A, () =>
        db.query("insert into public.category_names (category_id, name_en) values ($1, 'Walks')", [ownCustom.rows[0].id]),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(db, A, () => db.query("update public.category_names set name_ru = null, name_en = null")),
    ).rejects.toThrow(/check constraint/);
  });

  it("a custom category needs a name in at least one language, unique per language", async () => {
    await expect(
      asUser(db, A, () => db.query("insert into public.categories (user_id) values ($1)", [A])),
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(db, A, () => db.query("insert into public.categories (user_id, name_ru) values ($1, ' прогулки ')", [A])),
    ).rejects.toThrow(/duplicate key/);
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

  it("accepts entries in the future (ENT-01, changed 2026-10-28)", async () => {
    const res = await asUser(db, A, () =>
      db.query("insert into public.entries (body, occurred_on, occurred_time) values ('later', '2999-01-01', '10:00')"),
    );
    expect(res.affectedRows).toBe(1);
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
    for (const table of ["profiles", "entries", "categories", "hidden_categories", "category_names"]) {
      const col = table === "profiles" ? "id" : "user_id";
      const res = await db.query(`select 1 from public.${table} where ${col} = $1`, [B]);
      expect(res.rows, table).toHaveLength(0);
    }
  });
});
