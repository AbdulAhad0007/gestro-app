import os
import re

target_pairing = r"D:\myWork\gestro\ui\dialogs\pairing_dialog.py"
with open(target_pairing, "r", encoding="utf-8") as f:
    content_pairing = f.read()

# Add QTimer import
content_pairing = content_pairing.replace(
    "from PyQt6.QtCore import Qt",
    "from PyQt6.QtCore import Qt, QTimer"
)

# Add QTimer logic in __init__
init_code_replacement = """        btn_layout.addWidget(self.allow_btn)
        
        layout.addLayout(btn_layout)
        self.setLayout(layout)

        # 10 second countdown timer
        self.time_left = 10
        self.allow_btn.setText(f"Allow ({self.time_left}s)")
        
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_timer)
        self.timer.start(1000)

    def update_timer(self):
        self.time_left -= 1
        if self.time_left > 0:
            self.allow_btn.setText(f"Allow ({self.time_left}s)")
        else:
            self.allow_btn.setText("Allow (0s)")
            self.timer.stop()
            self.reject_request()
"""
content_pairing = content_pairing.replace(
    """        btn_layout.addWidget(self.allow_btn)
        
        layout.addLayout(btn_layout)
        self.setLayout(layout)""",
    init_code_replacement
)

# Also stop the timer in accept/reject
content_pairing = content_pairing.replace(
    """    def accept_request(self):
        self.approved = True
        self.accept()""",
    """    def accept_request(self):
        self.timer.stop()
        self.approved = True
        self.accept()"""
)
content_pairing = content_pairing.replace(
    """    def reject_request(self):
        self.approved = False
        self.reject()""",
    """    def reject_request(self):
        self.timer.stop()
        self.approved = False
        self.reject()"""
)

with open(target_pairing, "w", encoding="utf-8") as f:
    f.write(content_pairing)
print("Updated pairing_dialog.py")

# Update websocket_server.py
target_ws = r"D:\myWork\gestro\app\network\websocket_server.py"
with open(target_ws, "r", encoding="utf-8") as f:
    content_ws = f.read()

# Send pending message
ws_send_pending = """            if device_name not in self.trusted_devices:
                # Send pending status so client can start its countdown
                await websocket.send(json.dumps({"status": "pending"}))
                
                # Trigger pairing dialog on main thread
                approved = await self._prompt_pairing(device_name)"""
                
content_ws = content_ws.replace(
    """            if device_name not in self.trusted_devices:
                # Trigger pairing dialog on main thread
                approved = await self._prompt_pairing(device_name)""",
    ws_send_pending
)

# And in mock ws
mock_ws_pending = """                        # Handle connect handshake
                        if isinstance(data, dict) and data.get("type") == "connect":
                            device_name = data.get("device_name", "Unknown Device")
                            if device_name not in self.trusted_devices:
                                asyncio.run_coroutine_threadsafe(mock_ws.send(json.dumps({"status": "pending"})), self.loop)
                                # Trigger pairing dialog on main thread
                                async def wait_and_send():
                                    approved = await self._prompt_pairing(device_name)
                                    if approved:
                                        self.trusted_devices.add(device_name)
                                        await mock_ws.send(json.dumps({"status": "connected"}))
                                        if self.transfer_manager:
                                            self.transfer_manager.set_websocket(mock_ws, self.loop)
                                    else:
                                        await mock_ws.send(json.dumps({"status": "denied"}))
                                asyncio.run_coroutine_threadsafe(wait_and_send(), self.loop)
                                return
                            
                            # Auto-accept if trusted
                            asyncio.run_coroutine_threadsafe(mock_ws.send(json.dumps({"status": "connected"})), self.loop)
                            if self.transfer_manager:
                                self.transfer_manager.set_websocket(mock_ws, self.loop)
                            return"""

content_ws = content_ws.replace(
"""                        # Handle connect handshake
                        if isinstance(data, dict) and data.get("type") == "connect":
                            # Auto-accept since it's via our private channel
                            asyncio.run_coroutine_threadsafe(mock_ws.send(json.dumps({"status": "connected"})), self.loop)
                            if self.transfer_manager:
                                self.transfer_manager.set_websocket(mock_ws, self.loop)
                            return""",
mock_ws_pending
)

with open(target_ws, "w", encoding="utf-8") as f:
    f.write(content_ws)
print("Updated websocket_server.py")
