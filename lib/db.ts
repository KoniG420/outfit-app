import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('outfitapp.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS clothing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uri TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

export type ClothingItem = {
  id: number;
  uri: string;
  createdAt: string;
};