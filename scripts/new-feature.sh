#!/bin/bash
# Tạo feature mới — chỉ spec.md (lean)
set -e

FEATURE_NAME=$1
PROJECT=$2

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$FEATURE_NAME" ]; then
    echo -e "${RED}Usage: ./scripts/new-feature.sh <feature-name> [project-name]${NC}"
    exit 1
fi

if [ -z "$PROJECT" ]; then
    FEATURE_DIR="features/$FEATURE_NAME"
else
    FEATURE_DIR="projects/$PROJECT/features/$FEATURE_NAME"
fi

if [ -d "$FEATURE_DIR" ]; then
    echo -e "${RED}❌ Already exists: $FEATURE_DIR${NC}"
    exit 1
fi

TEMPLATE="features/_template/spec.md"
if [ ! -f "$TEMPLATE" ]; then
    echo -e "${RED}❌ Missing $TEMPLATE${NC}"
    exit 1
fi

mkdir -p "$FEATURE_DIR"
cp "$TEMPLATE" "$FEATURE_DIR/spec.md"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/<feature-name>/$FEATURE_NAME/g" "$FEATURE_DIR/spec.md"
    [ -n "$PROJECT" ] && sed -i '' "s/<project-name>/$PROJECT/g" "$FEATURE_DIR/spec.md"
else
    sed -i "s/<feature-name>/$FEATURE_NAME/g" "$FEATURE_DIR/spec.md"
    [ -n "$PROJECT" ] && sed -i "s/<project-name>/$PROJECT/g" "$FEATURE_DIR/spec.md"
fi

echo -e "${GREEN}✅ Created $FEATURE_DIR/spec.md${NC}"
echo "Next: fill spec → python scripts/validate-feature.py $FEATURE_DIR"
