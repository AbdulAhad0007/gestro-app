import os
import json

target = r"D:\myWork\gestro\app\network\websocket_server.py"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
imports = """import asyncio
import json
import websockets
import threading

from app.utils.logger import get_logger
from automation.action_executor import ActionExecutor
from automation.mouse_controller import MouseController
from profiles.profile_manager import profile_manager
from PyQt6.QtCore import pyqtSignal, QObject
from app.services.supabase_client import get_supabase
"""
content = content.replace(
"""import asyncio
import json
import websockets
import threading

from app.utils.logger import get_logger
from automation.action_executor import ActionExecutor
from automation.mouse_controller import MouseController
from profiles.profile_manager import profile_manager
from PyQt6.QtCore import pyqtSignal, QObject
""", imports)


# Inject relay background task
run_method = """    def run(self):
        asyncio.set_event_loop(self.loop)
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        try:
            # Run local server
            self.loop.run_until_complete(self._start_server())
            
            # Start relay task
            self.loop.create_task(self._start_supabase_relay())
            
            self.loop.run_forever()
"""

content = content.replace(
"""    def run(self):
        asyncio.set_event_loop(self.loop)
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        try:
            # Run local server
            self.loop.run_until_complete(self._start_server())
            
            self.loop.run_forever()
""", run_method)

# Inject relay method
relay_method = """    async def _start_supabase_relay(self):
        logger.info("Initializing Supabase Relay...")
        import socket
        device_name = socket.gethostname()
        
        while True:
            try:
                # Wait for active profile
                active_profile = profile_manager.get_active_profile()
                if not active_profile:
                    await asyncio.sleep(5)
                    continue
                    
                client = get_supabase()
                if not client:
                    await asyncio.sleep(5)
                    continue

                # Get device id
                res = client.table("user_devices").select("id").eq("device_name", device_name).eq("user_id", active_profile.user_id).execute()
                if not res.data or len(res.data) == 0:
                    await asyncio.sleep(5)
                    continue
                    
                device_id = res.data[0]["id"]
                channel_name = f"relay_{device_id}"
                logger.info(f"Subscribing to relay channel: {channel_name}")
                
                channel = client.channel(channel_name)
                
                # Mock websocket class to pass into _handle_command
                class MockRelayWebSocket:
                    def __init__(self, ch):
                        self.ch = ch
                    async def send(self, data):
                        payload_data = data
                        if isinstance(data, str):
                            try:
                                payload_data = json.loads(data)
                            except:
                                pass
                        self.ch.send({
                            "type": "broadcast",
                            "event": "from_pc",
                            "payload": payload_data
                        })
                
                mock_ws = MockRelayWebSocket(channel)
                
                def on_broadcast(payload):
                    # Runs in a separate thread potentially, so schedule it on the loop
                    if "payload" in payload:
                        data = payload["payload"]
                        if isinstance(data, str):
                            try:
                                data = json.loads(data)
                            except:
                                pass
                        
                        # Handle connect handshake
                        if isinstance(data, dict) and data.get("type") == "connect":
                            # Auto-accept since it's via our private channel
                            asyncio.run_coroutine_threadsafe(mock_ws.send(json.dumps({"status": "connected"})), self.loop)
                            if self.transfer_manager:
                                self.transfer_manager.set_websocket(mock_ws, self.loop)
                            return
                            
                        # Handle command
                        asyncio.run_coroutine_threadsafe(self._handle_command(data, mock_ws), self.loop)

                channel.on("broadcast", {"event": "from_app"}, on_broadcast)
                channel.subscribe()
                
                # Keep alive
                while True:
                    await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Relay error: {e}")
                await asyncio.sleep(10)
"""

content = content.replace("    def stop(self):", relay_method + "\n    def stop(self):")


with open(target, "w", encoding="utf-8") as f:
    f.write(content)

print("Backend patched successfully!")
