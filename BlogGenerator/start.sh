#!/bin/bash
python fix_images.py || true
# --workers 1: required so the background scheduler thread and generation_state
#              are shared across all requests (multiple workers = separate processes).
# --timeout 120: prevents gunicorn killing long-running generation requests.
gunicorn --workers 1 --timeout 120 --bind 0.0.0.0:$PORT wsgi:app
