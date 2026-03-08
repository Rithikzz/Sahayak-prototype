#!/usr/bin/env python3
"""
Sahayak DB Migration Script
============================
Standalone script to run all schema migrations against the Postgres DB.
Safe to run multiple times (all statements are idempotent).

Usage (from project root on EC2):
    # Inside the running backend container:
    docker exec sahayak_backend python /app/scripts/migrate.py

    # Or directly with psycopg2:
    python scripts/migrate.py
"""

import os
import sys
import psycopg2

DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = os.getenv("DB_PORT",     "5432")
DB_NAME     = os.getenv("DB_NAME",     "sahayak")
DB_USER     = os.getenv("DB_USER",     "sahayak")
DB_PASSWORD = os.getenv("DB_PASSWORD", "sahayak")

# ── All migrations in order ────────────────────────────────────────────────────
# Every statement MUST be idempotent (IF NOT EXISTS / DO NOTHING etc.)
MIGRATIONS = [
    # ── v0.0.1 ─ form_template_metadata extra columns ──────────────────────────
    (1, "Add original_pdf to form_template_metadata",
     "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS original_pdf TEXT"),

    (2, "Add field_coordinates to form_template_metadata",
     "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS field_coordinates JSONB"),

    (3, "Add pdf_filename to form_template_metadata",
     "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255)"),

    (4, "Add has_pdf to form_template_metadata",
     "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS has_pdf BOOLEAN DEFAULT FALSE"),

    # ── v0.0.5 ─ form_submissions PDF tracking ─────────────────────────────────
    (5, "Add form_template_id FK to form_submissions",
     "ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_template_id INTEGER REFERENCES form_template_metadata(id)"),

    (6, "Add filled_pdf_filename to form_submissions",
     "ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS filled_pdf_filename VARCHAR(255)"),

    # ── indexes for faster lookups ─────────────────────────────────────────────
    (7, "Index form_submissions.form_template_id",
     "CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id ON form_submissions(form_template_id)"),

    (8, "Index form_submissions.service_type",
     "CREATE INDEX IF NOT EXISTS idx_form_submissions_service_type ON form_submissions(service_type)"),

    (9, "Index form_template_metadata.category",
     "CREATE INDEX IF NOT EXISTS idx_form_template_metadata_category ON form_template_metadata(category)"),
]


def run():
    dsn = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"
    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME} …")

    try:
        conn = psycopg2.connect(dsn)
    except Exception as e:
        print(f"ERROR: Could not connect to DB: {e}", file=sys.stderr)
        sys.exit(1)

    conn.autocommit = False
    cur = conn.cursor()

    success, failed = 0, 0
    for num, desc, sql in MIGRATIONS:
        try:
            cur.execute(sql)
            conn.commit()
            print(f"  [{num:02d}] ✓  {desc}")
            success += 1
        except Exception as e:
            conn.rollback()
            print(f"  [{num:02d}] ✗  {desc}")
            print(f"       ERROR: {e}")
            failed += 1

    cur.close()
    conn.close()

    print(f"\nDone: {success} applied, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    run()
