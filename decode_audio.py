import json
import base64

# Replace 'response.json' with the filename where you saved the JSON response
with open("response.json", "r") as f:
    data = json.load(f)

# Extract the base64 audio content string
audio_base64 = data["audio_content"]

# Decode the base64 string to bytes
audio_bytes = base64.b64decode(audio_base64)

# Save the bytes to an mp3 file
with open("output.mp3", "wb") as out_file:
    out_file.write(audio_bytes)

print("Audio saved as output.mp3")