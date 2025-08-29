import { faker } from "@faker-js/faker";
import { env } from "@/utils/env";
import { DatabaseSync } from "node:sqlite";
import SqlBricks from "sql-bricks";
import { NotFoundError } from "@/errors/not-found";
import { generateRandomSalt } from "@/utils/generate-salt";
import { hashPassword } from "@/utils/hash-password";

type InsertProps = { table: string; items: any[] };
type UpdateProps = { table: string; item: any; id: string };
type ReadProps = { colums: string[]; table: string };

const database = new DatabaseSync(env.DATABASE_PATH);

const runSeed = async (items: any[]) => {
  const salt: string = generateRandomSalt();
  const password_hash: Buffer = await hashPassword({ password: "12345", salt });
  const arr = [
    {
      id: "0d262eed-2611-441c-9e24-815626805a23",
      username: "first",
      salt,
      password_hash,
      is_active: 1,
    },
  ];

  arr.push(...items);

  database.exec(`DROP TABLE IF EXISTS instagram_account`);

  database.exec(`CREATE TABLE instagram_account (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      salt TEXT NOT NULL,
      password_hash BLOB NOT NULL,
      is_active INTEGER
    ) STRICT
  `);
  sqliteDatabase.insert({ table: "instagram_account", items: arr });

  const data = sqliteDatabase.read({
    colums: ["id"],
    table: "instagram_account",
  });
  data.forEach((i) => console.log("Id: ", i.id));
};

class SqliteDatabase {
  constructor() {}

  insert(props: InsertProps) {
    try {
      const { items, table } = props;
      const { text: sql, values } = SqlBricks.insertInto(table, items).toParams(
        {
          placeholder: "?",
        }
      );
      const insertState = database.prepare(sql);
      insertState.run(...values);

      console.log(
        `INSERT operation completed: inserted ${items.length} item(s) into ${table}`
      );
    } catch (error) {}
  }

  read(props: ReadProps, id?: string) {
    try {
      const { colums, table } = props;
      if (id) {
        const query = SqlBricks.select(colums.join(", "))
          .where("id", id)
          .where("is_active", 1)
          .from(table)
          .toString();
        const data = database.prepare(query).all();
        if (data.length === 0) throw new NotFoundError("Account not found!");
        console.log("SELECT operation completed:  ", data);
        return data;
      }

      const query = SqlBricks.select(colums.join(", "))
        .where("is_active", 1)
        .from(table)
        .toString();
      const data = database.prepare(query).all();
      console.log("SELECT operation completed:  ", data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  update(props: UpdateProps) {
    try {
      const { id, item, table } = props;
      const { text, values } = SqlBricks.update(table, item)
        .where({ id })
        .where("is_active", 1)
        .toParams({ placeholder: "?" });

      const updateState = database.prepare(text);
      updateState.run(...values);

      console.log(`UPDATE operation completed: updated ${table} with ID ${id}`);
    } catch (error) {
      throw error;
    }
  }
}

const sqliteDatabase = new SqliteDatabase();

Promise.resolve(async () => {
  await runSeed(
    faker.helpers.multiple(
      async () => {
        const salt = generateRandomSalt();
        const password_hash: Buffer = await hashPassword({
          password: faker.string.uuid(),
          salt,
        });
        return {
          id: faker.string.uuid(),
          username: faker.internet.username(),
          salt,
          password_hash,
          is_active: 1,
        };
      },
      { count: 3 }
    )
  );
});

export { sqliteDatabase };
