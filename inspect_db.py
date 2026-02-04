import sqlite3, os, sys

db = 'cars.db'
print('DB path:', os.path.abspath(db))
if not os.path.exists(db):
    print('DB file not found')
    sys.exit(1)

conn = sqlite3.connect(db)
c = conn.cursor()

c.execute("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','index') ORDER BY name")
rows = c.fetchall()
if not rows:
    print('No objects in sqlite_master')
else:
    for name, typ, sql in rows:
        print(f'{typ}: {name}')
        print(sql)

print('\n--- row counts ---')
for name, typ, sql in rows:
    if typ == 'table':
        try:
            r = c.execute(f"SELECT COUNT(*) FROM {name}").fetchone()
            print(f'{name}: {r[0]} rows')
        except Exception as e:
            print(f'{name}: ERROR {e}')

conn.close()
