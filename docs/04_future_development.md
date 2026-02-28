# Future Development Guide

Welcome, future SAHAYAK developers! 

This system represents a fully containerized, microservice-based architecture powering an interactive Kiosk interface using React for touch UI and Python backends specifically for generative AI STT/TTS models. 

## Where to start building:

### Adding New Banking Forms
Currently, the frontend receives forms dynamically from PostgreSQL (`sahayak_db`), bridged by the Python FastAPI Core (`sahayak_backend`). 
To add new features or forms:
1. Open `/backend/api/routes/forms.py`. 
2. Add your new field schema directly into the template dictionary. The frontend will dynamically parse and render it automatically!
3. Restart `sahayak_backend`.

### Improving the Speech to Text
Currently, the app leverages `whisper-base`. To switch to `whisper-small` or implement streaming STT instead of batch inference:
1. Open `/microservices/stt/main.py`.
2. Change the `whisper.load_model("base")` instantiation. 
3. Rebuild the `stt` container! This will incur a larger memory footprint but significantly boost Indian English accuracy!

### Improving the Text to Speech
Currently the system uses Google `gTTS` which requires internet access. Native offline TTS integration is totally possible!
1. Open `/microservices/tts/main.py`
2. Replace `gTTS` with a high quality offline engine like `Coqui TTS` or `pyttsx3`.
3. Rebuild the `tts` container!

### Adding Authentication Features
The `staff_users` login system uses bare JWT tokens for rapid validation. To scale this for actual banking hardware kiosks:
1. Move the `JWT_SECRET` off of hardcoded configuration strings.
2. Link the `/api/auth/staff-login` endpoint inside `/backend/api/routes/auth.py` to an enterprise Active Directory/LDAP system or custom Biometric authentication logic.

Good luck! Use `docker compose logs -f` freely and enjoy the independent Python microservices! 🚀
