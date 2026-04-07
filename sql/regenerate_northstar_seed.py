from pathlib import Path
import csv
import re

repo = Path('/Users/luke/RiderProjects/Intex2026')
sql_file = repo / 'sql' / 'northstar.sql'
seed_dir = repo / 'backend' / 'Intex2026' / 'Intex2026' / 'Data' / 'seed'

order = [
    ('safehouses.csv', 'Safehouses'),
    ('partners.csv', 'Partners'),
    ('supporters.csv', 'Supporters'),
    ('residents.csv', 'Residents'),
    ('partner_assignments.csv', 'PartnerAssignments'),
    ('donations.csv', 'Donations'),
    ('in_kind_donation_items.csv', 'InKindDonationItems'),
    ('donation_allocations.csv', 'DonationAllocations'),
    ('education_records.csv', 'EducationRecords'),
    ('health_wellbeing_records.csv', 'HealthWellbeingRecords'),
    ('intervention_plans.csv', 'InterventionPlans'),
    ('incident_reports.csv', 'IncidentReports'),
    ('process_recordings.csv', 'ProcessRecordings'),
    ('home_visitations.csv', 'HomeVisitations'),
    ('safehouse_monthly_metrics.csv', 'SafehouseMonthlyMetrics'),
    ('social_media_posts.csv', 'SocialMediaPosts'),
    ('public_impact_snapshots.csv', 'PublicImpactSnapshots'),
]


def to_pascal(s: str) -> str:
    return ''.join(p.capitalize() for p in s.split('_'))


def parse_schema(prefix_sql: str) -> dict[str, dict[str, dict[str, str | bool]]]:
    schema: dict[str, dict[str, dict[str, str | bool]]] = {}
    current_table = None

    for raw_line in prefix_sql.splitlines():
        line = raw_line.strip()
        table_match = re.match(r'^CREATE TABLE \[([^\]]+)\] \($', line)
        if table_match:
            current_table = table_match.group(1)
            schema[current_table] = {}
            continue

        if current_table is None:
            continue

        if line == ');':
            current_table = None
            continue

        # Column definition lines look like:
        # [ColumnName] TYPE ... NULL/NOT NULL,
        col_match = re.match(r'^\[([^\]]+)\]\s+(.+)$', line)
        if not col_match:
            continue

        col_name = col_match.group(1)
        full_type = col_match.group(2).rstrip(',')

        # Skip constraint lines that can also start with bracket in other scripts.
        if col_name.startswith('PK_') or col_name.startswith('FK_'):
            continue

        col_type = full_type.split()[0].lower()
        not_null = 'NOT NULL' in full_type.upper()
        schema[current_table][col_name] = {
            'type': col_type,
            'not_null': not_null,
        }

    return schema


def default_for_column(col_name: str, col_type: str) -> str:
    lower_name = col_name.lower()
    if col_type.startswith('decimal'):
        return '0'
    if col_type in ('integer', 'int', 'bigint', 'smallint', 'tinyint', 'bit'):
        return '0'
    if col_type in ('text', 'nvarchar', 'varchar', 'char', 'nchar'):
        if 'createdat' in lower_name:
            return "'1900-01-01 00:00:00'"
        if 'date' in lower_name or lower_name.endswith('at') or lower_name.startswith('month'):
            return "'1900-01-01'"
        return "''"
    return "''"


def format_value(v: str, col_name: str, col_type: str, not_null: bool) -> str:
    if v is None:
        return default_for_column(col_name, col_type) if not_null else 'NULL'
    v = v.strip()
    if v == '':
        return default_for_column(col_name, col_type) if not_null else 'NULL'

    low = v.lower()
    if low in ('true', 'false'):
        return '1' if low == 'true' else '0'

    # Handle float-formatted integers from CSV (e.g., 8.0 for int columns).
    if col_type in ('integer', 'int', 'bigint', 'smallint', 'tinyint', 'bit') and re.fullmatch(r'-?\d+\.0+', v):
        return str(int(float(v)))

    if re.fullmatch(r'-?\d+', v):
        return v
    if re.fullmatch(r'-?\d+\.\d+', v):
        return v

    return "'" + v.replace("'", "''") + "'"


text = sql_file.read_text(encoding='utf-8')
marker = '\nINSERT INTO '
idx = text.find(marker)
if idx == -1:
    raise RuntimeError('Could not find insert section start in northstar.sql')
prefix = text[:idx + 1]


def main() -> None:
    schema = parse_schema(prefix)
    lines = []

    for csv_name, table in order:
        path = seed_dir / csv_name
        with path.open(newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            raw_headers = [h.strip() for h in (reader.fieldnames or [])]
            headers = [to_pascal(h) for h in raw_headers]
            col_list = ', '.join(f'[{h}]' for h in headers)
            for row in reader:
                vals_out = []
                for raw_h, col_name in zip(raw_headers, headers):
                    col_meta = schema.get(table, {}).get(col_name, {'type': 'text', 'not_null': False})
                    vals_out.append(format_value(
                        row[raw_h],
                        col_name,
                        str(col_meta['type']),
                        bool(col_meta['not_null']),
                    ))

                vals = ', '.join(vals_out)
                lines.append(f'INSERT INTO [{table}] ({col_list}) VALUES ({vals});')

    sql_file.write_text(prefix + '\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Wrote {len(lines)} inserts to {sql_file}')


if __name__ == '__main__':
    main()
