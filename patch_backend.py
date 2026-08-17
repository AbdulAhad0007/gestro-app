import os

file_system_controller_content = """import os
import string
import traceback
from typing import List, Dict, Optional

from app.utils.logger import get_logger

logger = get_logger("file_system_controller")

class FileSystemController:
    \"\"\"Controls and browses the local Windows file system for Gestro.\"\"\"

    @staticmethod
    def list_directory(path: Optional[str]) -> List[Dict]:
        \"\"\"
        Lists contents of a directory.
        If path is empty or None, lists available Windows drives.
        Returns a list of dicts: [{'name': str, 'path': str, 'type': 'folder'|'file', 'ext': str}]
        \"\"\"
        items = []
        try:
            if not path:
                # Return list of logical drives on Windows
                import ctypes
                bitmask = ctypes.windll.kernel32.GetLogicalDrives()
                for letter in string.ascii_uppercase:
                    if bitmask & 1:
                        drive_path = f"{letter}:\\\\"
                        if os.path.exists(drive_path):
                            items.append({
                                "name": f"{letter}:",
                                "path": drive_path,
                                "type": "folder",
                                "ext": ""
                            })
                    bitmask >>= 1
                return items
            
            # List directory contents
            if not os.path.exists(path) or not os.path.isdir(path):
                logger.warning(f"Path does not exist or is not a directory: {path}")
                return items
                
            try:
                for entry in os.scandir(path):
                    is_dir = entry.is_dir(follow_symlinks=False)
                    ext = "" if is_dir else os.path.splitext(entry.name)[1].lower()
                    
                    items.append({
                        "name": entry.name,
                        "path": entry.path,
                        "type": "folder" if is_dir else "file",
                        "ext": ext
                    })
            except PermissionError:
                logger.warning(f"Permission denied accessing directory: {path}")
            
            # Sort folders first, then files, both alphabetically
            items.sort(key=lambda x: (x["type"] == "file", x["name"].lower()))
            
            return items

        except Exception as e:
            logger.error(f"Failed to list directory {path}: {e}\\n{traceback.format_exc()}")
            return []
"""

target_path = r"D:\myWork\gestro\automation\file_system_controller.py"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(file_system_controller_content)

print("Successfully wrote file_system_controller.py")
