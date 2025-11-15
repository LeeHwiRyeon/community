#!/bin/bash
# 데이터베이스 마이그레이션 실행 스크립트

echo "🔄 데이터베이스 마이그레이션 시작..."

# MySQL이 준비될 때까지 대기
until mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
  echo "⏳ MySQL 연결 대기 중..."
  sleep 2
done

echo "✅ MySQL 연결 성공!"

# 마이그레이션 파일 실행
MIGRATIONS=(
  "add_online_status.sql"
  "add_moderator_tools.sql"
  "add_follow_system.sql"
  "add_bookmark_system.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "📝 실행 중: $migration"
  mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "/app/migrations/$migration"
  
  if [ $? -eq 0 ]; then
    echo "✅ 완료: $migration"
  else
    echo "❌ 실패: $migration"
    exit 1
  fi
done

echo "🎉 모든 마이그레이션 완료!"
