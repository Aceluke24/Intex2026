from pathlib import Path
import re

sql_path = Path('/Users/luke/RiderProjects/Intex2026/sql/northstar.sql')
sql = sql_path.read_text(encoding='utf-8')

insert_start = sql.find('\nINSERT INTO [')
if insert_start == -1:
    raise RuntimeError('No insert section found')

prefix = sql[:insert_start + 1]
inserts = [line for line in sql[insert_start + 1 :].splitlines() if line.startswith('INSERT INTO [')]

schema = {}
current = None
for raw in prefix.splitlines():
    line = raw.strip()
    m = re.match(r'^CREATE TABLE \[([^\]]+)\] \($', line)
    if m:
        current = m.group(1)
        schema[current] = {}
        continue
    if current and line == ');':
        current = None
        continue
    if current is None:
        continue

    cm = re.match(r'^\[([^\]]+)\]\s+(.+)$', line)
    if not cm:
        continue

    col_name = cm.group(1)
    definition = cm.group(2).rstrip(',')
    schema[current][col_name] = 'NOT NULL' in definition.upper()


def split_values(values_sql: str) -> list[str]:
    vals = []
    token = []
    in_string = False
    i = 0
    while i < len(values_sql):
        ch = values_sql[i]
        if ch == "'":
            token.append(ch)
            if in_string and i + 1 < len(values_sql) and values_sql[i + 1] == "'":
                token.append(values_sql[i + 1])
                i += 2
                continue
            in_string = not in_string
            i += 1
            continue
        if ch == ',' and not in_string:
            vals.append(''.join(token).strip())
            token = []
            i += 1
            continue
        token.append(ch)
        i += 1
    vals.append(''.join(token).strip())
    return vals

violations = []
pattern = re.compile(r'^INSERT INTO \[([^\]]+)\] \(([^\)]+)\) VALUES \((.*)\);$')

for line in inserts:
    m = pattern.match(line)
    if not m:
        continue
    table = m.group(1)
    cols = [c.strip().strip('[]') for c in m.group(2).split(',')]
    vals = split_values(m.group(3))

    table_schema = schema.get(table, {})
    for col, val in zip(cols, vals):
        if table_schema.get(col, False) and val.upper() == 'NULL':
            violations.append((table, col, line[:200]))
            if len(violations) >= 25:
                break
    if len(violations) >= 25:
        break

if violations:
    print('FOUND_NOT_NULL_VIOLATIONS', len(violations))
    for v in violations[:10]:
        print(v[0], v[1], v[2])
else:
    print('FOUND_NOT_NULL_VIOLATIONS 0')
