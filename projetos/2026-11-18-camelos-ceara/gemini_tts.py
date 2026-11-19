"""Narração oficial do canal: Gemini TTS, voz Fenrir, +5% de velocidade (desde 19/11).
uso: python3 gemini_tts.py script.txt voice.wav [VOZ] [VELOCIDADE]
- A chave fica no ambiente da nuvem (header x-goog-api-key injetado pelo proxy); não precisa de variável.
- Mande SÓ o texto: instruções de estilo são lidas em voz alta. A emoção vem da pontuação do roteiro
  ("...", "!", palavras em MAIÚSCULA para ênfase).
- Tenta o modelo novo e cai para o antigo; repete com espera em erro 429/500."""
import sys, json, base64, wave, time, subprocess, urllib.request, urllib.error
import os
KF = "/root/.config/gemini_key2"   # chave escolhida pelo dono (fica fora do repositório); se existir, é a única usada
KEYQ = ("?key=" + open(KF).read().strip()) if os.path.exists(KF) else ""
src, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "Fenrir"   # voz oficial do canal desde 19/11 (escolha do dono), velocidade +5%
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.05
txt = open(src, encoding="utf-8").read().strip()
body = {"contents": [{"parts": [{"text": txt}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
d = None
for attempt in range(4):
    for model in ["gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]:
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent" + KEYQ,
                                     data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        try:
            d = json.load(urllib.request.urlopen(req, timeout=300)); break
        except urllib.error.HTTPError as e:
            print(model, e.code, e.read()[:200].decode(errors="ignore"), flush=True)
        except Exception as e:
            print(model, e, flush=True)
    if d: break
    time.sleep(30 * (attempt + 1))
if not d: sys.exit("Gemini TTS falhou em todas as tentativas")
pcm = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
with wave.open("_raw.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "_raw.wav", "-af", f"atempo={speed},silenceremove=start_periods=1:start_threshold=-45dB,apad=pad_dur=0.4", "-ar", "24000", out], check=True)
print(out, model, voice, speed)
