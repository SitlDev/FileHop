#!/bin/bash
# Git commit and push with verification
# Usage: ./scripts/git-push-verify.sh "commit message"

if [ -z "$1" ]; then
    echo "Error: Commit message required"
    echo "Usage: ./scripts/git-push-verify.sh \"commit message\""
    exit 1
fi

COMMIT_MSG="$1"
LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "📝 Staging changes..."
git add -A

echo "💾 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"
if [ $? -ne 0 ]; then
    echo "❌ Commit failed"
    exit 1
fi

LOCAL_HASH=$(git rev-parse HEAD)
echo "✅ Local commit: $LOCAL_HASH"

echo "🚀 Pushing to origin/$LOCAL_BRANCH..."
git push origin "$LOCAL_BRANCH"
if [ $? -ne 0 ]; then
    echo "❌ Push failed"
    exit 1
fi

echo "⏳ Verifying push..."
sleep 1

REMOTE_HASH=$(git rev-parse origin/$LOCAL_BRANCH)
if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo "✅ VERIFIED: Local and remote commits match"
    echo "   Local:  $LOCAL_HASH"
    echo "   Remote: $REMOTE_HASH"
    echo "✅ Push successful!"
    exit 0
else
    echo "❌ VERIFICATION FAILED: Commits don't match"
    echo "   Local:  $LOCAL_HASH"
    echo "   Remote: $REMOTE_HASH"
    exit 1
fi
