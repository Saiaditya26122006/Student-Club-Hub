"""Student Club-Hub API - Application Entry Point

For development: python run.py
For production: gunicorn -c gunicorn_config.py run:app
"""
import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Development mode
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    print(f"✅ Student Club-Hub API running on port {port}")
    app.run(debug=debug, host="0.0.0.0", port=port)

