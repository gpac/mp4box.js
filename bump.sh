#!/bin/sh
  
# Automatically tag the last commit.
LAST_COMMIT=$(git rev-parse --short HEAD)
echo current commit: $LAST_COMMIT

BRANCH=$(git branch | sed -n '/\* /s///p')
echo current branch: $BRANCH

LAST_TAG=$(git describe --tags --always --abbrev=1 --dirty=-d)
LAST_TAG=mp4box-10.12.32
echo $LAST_TAG

LAST_TAG_NAME=$(echo $LAST_TAG | sed -n 's/\([^-]*\)-.*/\1/p')
LAST_TAG_NUMBER=$(echo $LAST_TAG | sed -n 's/.*\.\(.*\)-.*-.*/\1/p')

if ($LAST_TAG_NUMBER) then LAST_TAG_VERSION=$(echo $LAST_TAG | sed -n 's/.*-\(.*\)\..*-.*-.*/\1/p')
else LAST_TAG_VERSION=$(echo $LAST_TAG | sed -n 's/.*-\(.*\)/\1/p')

LAST_TAG_BRANCH=$(echo $LAST_TAG | sed -n 's/.*-.*-\(.*\)-.*/\1/p')
LAST_TAG_COMMIT=$(echo $LAST_TAG | sed -n 's/.*-.*-.*-\(.*\)/\1/p')

echo Last tag name: $LAST_TAG_NAME
echo Last tag version: $LAST_TAG_VERSION
echo Last tag number: $LAST_TAG_NUMBER
echo Last tag branch: $LAST_TAG_BRANCH
echo Last tag commit: $LAST_TAG_COMMIT

LAST_TAG_NUMBER=$((LAST_TAG_NUMBER+1))
echo new commit number: $LAST_TAG_NUMBER

NEW_TAG="$LAST_TAG_NAME-$LAST_TAG_VERSION.$LAST_TAG_NUMBER-$BRANCH-$LAST_COMMIT"
#git tag $NEW_TAG $LAST_COMMIT
echo New tag: $NEW_TAG
LAST_TAG=$NEW_TAG