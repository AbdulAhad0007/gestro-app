import re

with open(r"D:\myWork\gestro\automation\action_executor.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "FileSystemController" not in content:
    content = content.replace(
        "from automation.mouse_controller import MouseController",
        "from automation.mouse_controller import MouseController\nfrom automation.file_system_controller import FileSystemController"
    )

# Add commands
commands_to_add = """            elif action == "LIST_DIRECTORY":
                path = params.get("path") if params else None
                response_data = FileSystemController.list_directory(path)
                success = True
            elif action == "LAUNCH_FILE":
                if params and "path" in params:
                    success = ApplicationController.launch_app(params["path"])
"""

if "LIST_DIRECTORY" not in content:
    content = content.replace(
        "elif action == \"LAUNCH_APP\":",
        commands_to_add + "            elif action == \"LAUNCH_APP\":"
    )

with open(r"D:\myWork\gestro\automation\action_executor.py", "w", encoding="utf-8") as f:
    f.write(content)

print("action_executor.py updated successfully.")
