#!/bin/bash
# Быстрая упаковка проекта в архив (без сборки)
# Сборка произойдёт при установке на целевой машине

set -e

ARCHIVE_NAME="price-alert-daemon"
ARCHIVE_FILE="${ARCHIVE_NAME}.tar.gz"

echo "📦 Упаковка проекта в ${ARCHIVE_FILE}..."

# Создаём временную директорию
rm -rf "/tmp/${ARCHIVE_NAME}"
mkdir -p "/tmp/${ARCHIVE_NAME}"

# Копируем все файлы проекта
cp -r daemon "/tmp/${ARCHIVE_NAME}/daemon"
cp -r src "/tmp/${ARCHIVE_NAME}/src"
cp index.html "/tmp/${ARCHIVE_NAME}/"
cp package.json "/tmp/${ARCHIVE_NAME}/"
cp package-lock.json "/tmp/${ARCHIVE_NAME}/" 2>/dev/null || true
cp tsconfig.json "/tmp/${ARCHIVE_NAME}/"
cp vite.config.js "/tmp/${ARCHIVE_NAME}/"
cp build-archive.sh "/tmp/${ARCHIVE_NAME}/"
cp INSTALL.md "/tmp/${ARCHIVE_NAME}/"

# Убираем node_modules и dist если есть
rm -rf "/tmp/${ARCHIVE_NAME}/daemon/node_modules"
rm -rf "/tmp/${ARCHIVE_NAME}/daemon/dist"
rm -rf "/tmp/${ARCHIVE_NAME}/node_modules"
rm -rf "/tmp/${ARCHIVE_NAME}/dist"

# Создаём архив
cd /tmp
tar -czf "${OLDPWD}/${ARCHIVE_FILE}" "${ARCHIVE_NAME}"
cd "${OLDPWD}"

# Удаляем временную директорию
rm -rf "/tmp/${ARCHIVE_NAME}"

# Выводим результат
SIZE=$(du -h "${ARCHIVE_FILE}" | cut -f1)
echo ""
echo "✅ Архив создан: ${ARCHIVE_FILE} (${SIZE})"
echo ""
echo "📦 Распаковать:"
echo "   tar -xzf ${ARCHIVE_FILE}"
echo "   cd ${ARCHIVE_NAME}"
echo ""
echo "🚀 Установить:"
echo "   chmod +x build-archive.sh"
echo "   ./build-archive.sh"
echo ""
