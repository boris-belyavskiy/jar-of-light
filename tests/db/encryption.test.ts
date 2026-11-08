import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createDb, createUser, type Db } from "./harness";

// Encryption, step 1 (ADR-0011): the tables hold plaintext, ciphertext or both,
// and each user sees only their own wrapped keys. The values below are fake
// ciphertext: the database never decrypts anything.

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const KEY = {
  salt: "c2FsdHNhbHRzYWx0c2FsdA==",
  params: JSON.stringify({ m: 65536, t: 3, p: 1 }),
  wrapped: "djEud3JhcHBlZGtleXdyYXBwZWRrZXk=",
};

let db: Db;
let systemCategory: string;

const insertKeys = (userId: string) =>
  db.query(
    `insert into public.user_keys (user_id, kdf_salt, kdf_params, wrapped_key_password, wrapped_key_recovery)
     values ($1, $2, $3::jsonb, $4, $4)`,
    [userId, KEY.salt, KEY.params, KEY.wrapped],
  );

beforeAll(async () => {
  db = await createDb();
  await createUser(db, A, "Alice");
  await createUser(db, B, "Bob");
  systemCategory = (await db.query<{ id: string }>("select id from public.categories where slug = 'family'"))
    .rows[0].id;
  await asUser(db, B, () => insertKeys(B));
}, 60_000);

describe("user_keys", () => {
  it("a user stores and reads their own wrapped keys", async () => {
    await asUser(db, A, () => insertKeys(A));
    const rows = await asUser(db, A, () =>
      db.query<{ user_id: string; key_version: number }>("select user_id, key_version from public.user_keys"),
    );
    expect(rows.rows).toEqual([{ user_id: A, key_version: 1 }]);
  });

  it("A cannot read, change or replace B's keys", async () => {
    const asA = <T>(fn: () => Promise<T>) => asUser(db, A, fn);
    const others = await asA(() => db.query("select * from public.user_keys where user_id = $1", [B]));
    expect(others.rows).toHaveLength(0);
    const upd = await asA(() => db.query("update public.user_keys set kdf_salt = $1 where user_id = $2", [KEY.salt, B]));
    expect(upd.affectedRows).toBe(0);
    await expect(asA(() => insertKeys(B))).rejects.toThrow(/row-level security|duplicate key/);
  });

  it("the user id comes from the session when it is not given", async () => {
    const other = "00000000-0000-4000-8000-00000000000c";
    await createUser(db, other, "Carol");
    await asUser(db, other, () =>
      db.query(
        `insert into public.user_keys (kdf_salt, kdf_params, wrapped_key_password, wrapped_key_recovery)
         values ($1, $2::jsonb, $3, $3)`,
        [KEY.salt, KEY.params, KEY.wrapped],
      ),
    );
    const rows = await asUser(db, other, () => db.query<{ user_id: string }>("select user_id from public.user_keys"));
    expect(rows.rows).toEqual([{ user_id: other }]);
  });

  it("keys cannot be deleted, so the entries cannot be orphaned by a mistake", async () => {
    await expect(asUser(db, A, () => db.query("delete from public.user_keys"))).rejects.toThrow(/permission denied/);
  });

  it("the password wrap can be replaced (change of diary password)", async () => {
    const res = await asUser(db, A, () =>
      db.query("update public.user_keys set wrapped_key_password = $1, key_version = 2", [KEY.wrapped + "x"]),
    );
    expect(res.affectedRows).toBe(1);
  });

  it("rejects an empty or oversized wrapped key", async () => {
    await expect(
      asUser(db, A, () => db.query("update public.user_keys set wrapped_key_password = 'x'")),
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(db, A, () => db.query("update public.user_keys set wrapped_key_recovery = $1", ["x".repeat(513)])),
    ).rejects.toThrow(/check constraint/);
  });

  it("anon has no access", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from public.user_keys")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });

  it("goes away with the account", async () => {
    await db.query("delete from auth.users where id = $1", [A]);
    const rows = await db.query("select * from public.user_keys where user_id = $1", [A]);
    expect(rows.rows).toHaveLength(0);
  });
});

describe("the encryption mark", () => {
  it("a user can read it but cannot set it by a direct update", async () => {
    const own = await asUser(db, B, () => db.query<{ encrypted_at: string | null }>("select encrypted_at from public.profiles"));
    expect(own.rows).toEqual([{ encrypted_at: null }]);
    await expect(
      asUser(db, B, () => db.query("update public.profiles set encrypted_at = now()")),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("entries hold plaintext, ciphertext or both", () => {
  const insert = (cols: string, values: string) =>
    asUser(db, B, () =>
      db.query(`insert into public.entries (${cols}, occurred_on, occurred_time) values (${values}, '2026-01-01', '10:00')`),
    );

  it("accepts plaintext only, as before", async () => {
    await insert("body", "'plain'");
  });

  it("accepts ciphertext only", async () => {
    await insert("body_enc", "'djEuY2lwaGVydGV4dA=='");
  });

  it("accepts both while an account is being moved (step 3)", async () => {
    await insert("body, body_enc", "'plain', 'djEuY2lwaGVydGV4dA=='");
  });

  it("rejects a row with neither", async () => {
    await expect(insert("body", "null")).rejects.toThrow(/check constraint/);
  });

  it("still rejects blank and over-long plaintext, and over-long ciphertext", async () => {
    await expect(insert("body", "'   '")).rejects.toThrow(/check constraint/);
    await expect(insert("body", `'${"a".repeat(4001)}'`)).rejects.toThrow(/check constraint/);
    await expect(insert("body_enc", `'${"a".repeat(24001)}'`)).rejects.toThrow(/check constraint/);
  });

  it("the plaintext can be erased once ciphertext exists, and not before", async () => {
    await asUser(db, B, async () => {
      await db.query("update public.entries set body = null where body_enc is not null and body is not null");
      await expect(db.query("update public.entries set body = null, body_enc = null")).rejects.toThrow(/check constraint/);
    });
  });

  it("A cannot write ciphertext into B's entry", async () => {
    const id = (await db.query<{ id: string }>("select id from public.entries where user_id = $1 limit 1", [B])).rows[0].id;
    await createUser(db, "00000000-0000-4000-8000-0000000000d1", "Dave");
    const res = await asUser(db, "00000000-0000-4000-8000-0000000000d1", () =>
      db.query("update public.entries set body_enc = 'djEuaGFja2Vk' where id = $1", [id]),
    );
    expect(res.affectedRows).toBe(0);
  });
});

describe("categories hold plaintext or ciphertext names", () => {
  it("an own category may carry only encrypted names", async () => {
    await asUser(db, B, () =>
      db.query("insert into public.categories (user_id, name_ru_enc) values ($1, 'djEubmFtZQ==')", [B]),
    );
  });

  it("an own category still needs a name in some form", async () => {
    await expect(
      asUser(db, B, () => db.query("insert into public.categories (user_id) values ($1)", [B])),
    ).rejects.toThrow(/check constraint/);
  });

  it("two encrypted names do not collide, because uniqueness is checked on the device", async () => {
    await asUser(db, B, () =>
      db.query("insert into public.categories (user_id, name_ru_enc) values ($1, 'djEubmFtZQ==')", [B]),
    );
  });

  it("a built-in category carries no name of any kind", async () => {
    await expect(
      db.query("insert into public.categories (slug, name_ru_enc) values ('extra', 'djEubmFtZQ==')"),
    ).rejects.toThrow(/check constraint/);
  });

  it("a rename of a built-in category may be encrypted, and may not be empty", async () => {
    await asUser(db, B, () =>
      db.query("insert into public.category_names (category_id, name_en_enc) values ($1, 'djEucmVuYW1l')", [systemCategory]),
    );
    await expect(
      asUser(db, B, () =>
        db.query("update public.category_names set name_en_enc = null where category_id = $1", [systemCategory]),
      ),
    ).rejects.toThrow(/check constraint/);
  });
});
