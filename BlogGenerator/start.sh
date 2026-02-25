#!/bin/bash
gunicorn --bind 0.0.0.0:$PORT dashboard_app:app
