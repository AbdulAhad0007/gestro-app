import os
import json

target = r"D:\myWork\gestro\app\network\websocket_server.py"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

old_send = """                    async def send(self, data):
                        await self.ch.send_broadcast("from_pc", data)"""

new_send = """                    async def send(self, data):
                        payload_data = data
                        if isinstance(data, str):
                            try:
                                payload_data = json.loads(data)
                            except:
                                pass
                        await self.ch.send_broadcast("from_pc", {"payload": payload_data})"""

if old_send in content:
    content = content.replace(old_send, new_send)
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed MockRelayWebSocket.send")
else:
    print("Could not find old_send")
