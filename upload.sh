#!/bin/sh
rsync -RacP --copy-links --filter=':- .gitignore' . ubuntu@35.157.56.166: