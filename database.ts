import { DatabaseSync } from "node:sqlite";
import SqlBricks from "sql-bricks";

type InsertProps = { table: string; items: any[] };
type UpdateProps = { table: string; item: any; id: string };
type SelectProps = { query: string };
type DeleteProps = { table: string; id: string };

export class SqliteDatabase {
  private database: DatabaseSync;
  constructor(path: string, seed: string[]) {
    this.database = new DatabaseSync(path);

    seed.forEach((sql) => {
      this.database.exec(sql);
    });
  }

  insert(props: InsertProps) {
    const { table, items } = props;
    const { text, values } = SqlBricks.insertInto(table, items).toParams({
      placeholder: "?",
    });

    const insertState = this.database.prepare(text);
    insertState.run(...values);

    console.log(
      `INSERT operation completed: inserted ${items.length} item(s) into ${table}`
    );
  }
  update(props: UpdateProps) {
    const { id, item, table } = props;
    const { text, values } = SqlBricks.update(table, item)
      .where({ id })
      .toParams({ placeholder: "?" });

    const updateState = this.database.prepare(text);
    updateState.run(...values);

    console.log(`UPDATE operation completed: updated student with ID ${id}`);
  }
  select(props: SelectProps) {
    const { query } = props;
    const result = this.database.prepare(query).all();
    console.log("SELECT operation completed: ", result);
    return result;
  }
  delete(props: DeleteProps) {
    const { id, table } = props;

    const { text, values } = SqlBricks.deleteFrom(table)
      .where({ id })
      .toParams({ placeholder: "?" });

    const deleteState = this.database.prepare(text);
    deleteState.run(...values);

    console.log(`DELETE operation completed: removed student with ID ${id}`);
  }
}
