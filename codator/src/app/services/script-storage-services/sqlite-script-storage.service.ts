import { Injectable } from '@angular/core';
import { FunctionScript } from '../../interfaces/function-script.interface';
import { ScriptStorageStrategy } from '../../interfaces/script-storage.strategy.interface';

const sqlite3 = require('sqlite3').verbose();
@Injectable({
  providedIn: 'root',
})
export class SqliteScriptStorageService implements ScriptStorageStrategy {
  private db: any;

  constructor() {
    this.db = new sqlite3.Database('scripts.db');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        code TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  }

  async save(script: FunctionScript): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
        INSERT INTO scripts (id, name, description, code, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        code = excluded.code,
        updatedAt = excluded.updatedAt
        `,
        [
          script.id,
          script.name,
          script.description,
          script.code,
          script.createdAt.toISOString(),
          script.updatedAt.toISOString(),
        ],
        (err: any) => (err ? reject(err) : resolve())
      );
    });
  }

  async get(id: string): Promise<FunctionScript | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM scripts WHERE id = ?`,
        [id],
        (err: any, row: any) => {
          if (err) reject(err);
          resolve(
            row
              ? {
                  ...row,
                  createdAt: new Date(row.createdAt),
                  updatedAt: new Date(row.updatedAt),
                }
              : null
          );
        }
      );
    });
  }

  async getAll(): Promise<FunctionScript[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM scripts`, [], (err: any, rows: any[]) => {
        if (err) reject(err);
        resolve(
          rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          }))
        );
      });
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM scripts WHERE id = ?`, [id], (err: any) =>
        err ? reject(err) : resolve()
      );
    });
  }
}
