#!/bin/sh
set -eu

cd "$(dirname "$0")/../.."

docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' <<'SQL'
CREATE TEMP TABLE cleanup_invitation_ids AS
SELECT DISTINCT i.id
FROM registration_invitations i
LEFT JOIN invitation_participants p ON p.invitation_id = i.id
WHERE i.token = 'demo-token'
   OR i.remark IN ('委托书材料收集', '本地演示邀请')
   OR (
        i.remark = '公开填写入口自动创建'
        AND (
          p.submitted_fields_json ->> 'full_company_name' IN ('aaasd')
          OR p.name IN ('dfadfsa')
          OR p.mobile IN ('asdfsfsd')
        )
      );

CREATE TEMP TABLE cleanup_material_ids AS
SELECT id
FROM invitation_materials
WHERE invitation_id IN (SELECT id FROM cleanup_invitation_ids);

CREATE TEMP TABLE cleanup_file_ids AS
SELECT file_id AS id
FROM invitation_materials
WHERE invitation_id IN (SELECT id FROM cleanup_invitation_ids)
  AND file_id IS NOT NULL;

DELETE FROM invitation_materials
WHERE id IN (SELECT id FROM cleanup_material_ids);

DELETE FROM files
WHERE id IN (SELECT id FROM cleanup_file_ids);

DELETE FROM invitation_participants
WHERE invitation_id IN (SELECT id FROM cleanup_invitation_ids);

DELETE FROM registration_invitations
WHERE id IN (SELECT id FROM cleanup_invitation_ids);

DROP TABLE cleanup_file_ids;
DROP TABLE cleanup_material_ids;
DROP TABLE cleanup_invitation_ids;
SQL

echo "Test data cleanup finished."
