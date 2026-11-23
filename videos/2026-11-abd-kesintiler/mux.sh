#!/bin/sh
# Combine rendered picture and synthesised soundtrack into the final social-media MP4.
set -e
cd "$(dirname "$0")/out"
for v in "$@"; do
  ffmpeg -y -loglevel error -i "$v.video.mp4" -i "$v.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 \
    -shortest -movflags +faststart "$v.mp4"
  echo "out/$v.mp4"
done
