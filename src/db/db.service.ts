/**
 * ============================================================
 *  DATABASE SERVICE  (expo-sqlite)
 *
 *  Local SQLite database. Stores:
 *  - Chat history (messages per session)
 *  - Library items (saved videos, analyses, notes)
 *  - User settings / preferences
 *
 *  FOR FUTURE AGENTS:
 *  - All data lives locally on the device
 *  - If you need cloud sync, add a sync layer on top
 *  - Schema migrations: add new columns in migrateIfNeeded()
 *  - Tables are created automatically on first run
 * ============================================================
 */

import * as SQLite from 'expo-sqlite';
import { FEATURES } from '../config/features';

export interface LibraryItem {
  id?: number;
  type: 'video' | 'analysis' | 'note' | 'link';
  title: string;
  content: string; // JSON string
  tags: string;    // comma-separated
  createdAt: number;
  updatedAt?: number;
}

export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'agent' | 'tool';
  content: string;
  toolName?: string;
  imageUri?: string;
  timestamp: number;
}

export interface GetItemsOptions {
  type?: string;
  search?: string;
  limit?: number;
}

class DbService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (!FEATURES.localDatabase) return;

    this.db = await SQLite.openDatabaseAsync('boilerplate.db');
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS library_items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        type        TEXT    NOT NULL,
        title       TEXT    NOT NULL,
        content     TEXT    NOT NULL DEFAULT '{}',
        tags        TEXT    NOT NULL DEFAULT '',
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT    NOT NULL,
        role        TEXT    NOT NULL,
        content     TEXT    NOT NULL,
        tool_name   TEXT,
        image_uri   TEXT,
        timestamp   INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key         TEXT PRIMARY KEY,
        value       TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_library_type ON library_items(type);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
    `);
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('[DbService] Database not initialised. Call init() first.');
    return this.db;
  }

  // ── Library Items ──────────────────────────────────────────

  async saveItem(item: Omit<LibraryItem, 'id'>): Promise<number> {
    if (!FEATURES.localDatabase) return -1;
    const db = this.getDb();
    const result = await db.runAsync(
      `INSERT INTO library_items (type, title, content, tags, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [item.type, item.title, item.content, item.tags, item.createdAt]
    );
    return result.lastInsertRowId;
  }

  async getItems(options: GetItemsOptions = {}): Promise<LibraryItem[]> {
    if (!FEATURES.localDatabase) return [];
    const db = this.getDb();

    let query = 'SELECT * FROM library_items WHERE 1=1';
    const params: (string | number)[] = [];

    if (options.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }
    if (options.search) {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(options.limit ?? 20);

    const rows = await db.getAllAsync<any>(query, params);
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      content: r.content,
      tags: r.tags,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async deleteItem(id: number): Promise<void> {
    if (!FEATURES.localDatabase) return;
    await this.getDb().runAsync('DELETE FROM library_items WHERE id = ?', [id]);
  }

  // ── Chat History ───────────────────────────────────────────

  async saveMessage(msg: Omit<ChatMessage, 'id'>): Promise<number> {
    if (!FEATURES.localDatabase) return -1;
    const result = await this.getDb().runAsync(
      `INSERT INTO chat_messages (session_id, role, content, tool_name, image_uri, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [msg.sessionId, msg.role, msg.content, msg.toolName ?? null, msg.imageUri ?? null, msg.timestamp]
    );
    return result.lastInsertRowId;
  }

  async getMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    if (!FEATURES.localDatabase) return [];
    const rows = await this.getDb().getAllAsync<any>(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?',
      [sessionId, limit]
    );
    return rows.map(r => ({
      id: r.id,
      sessionId: r.session_id,
      role: r.role,
      content: r.content,
      toolName: r.tool_name,
      imageUri: r.image_uri,
      timestamp: r.timestamp,
    }));
  }

  async getSessions(): Promise<{ sessionId: string; lastMessage: string; updatedAt: number }[]> {
    if (!FEATURES.localDatabase) return [];
    return this.getDb().getAllAsync<any>(
      `SELECT session_id, content as lastMessage, MAX(timestamp) as updatedAt
       FROM chat_messages GROUP BY session_id ORDER BY updatedAt DESC`
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!FEATURES.localDatabase) return;
    await this.getDb().runAsync('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
  }

  // ── Settings ───────────────────────────────────────────────

  async setSetting(key: string, value: string): Promise<void> {
    if (!FEATURES.localDatabase) return;
    await this.getDb().runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  async getSetting(key: string, fallback?: string): Promise<string | undefined> {
    if (!FEATURES.localDatabase) return fallback;
    const row = await this.getDb().getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? fallback;
  }
}

export const dbService = new DbService();
