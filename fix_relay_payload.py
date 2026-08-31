import os

target_ws = r"D:\myWork\gestro\app\network\websocket_server.py"

with open(target_ws, "r", encoding="utf-8") as f:
    content_ws = f.read()

# Fix the payload wrapping issue in MockRelayWebSocket
old_mock_send = """                        await self.ch.send_broadcast("from_pc", {"payload": payload_data})"""
new_mock_send = """                        await self.ch.send_broadcast("from_pc", payload_data)"""

if old_mock_send in content_ws:
    content_ws = content_ws.replace(old_mock_send, new_mock_send)
    with open(target_ws, "w", encoding="utf-8") as f:
        f.write(content_ws)
    print("Fixed websocket_server.py relay payload.")
else:
    print("Could not find the target string to replace in websocket_server.py")
