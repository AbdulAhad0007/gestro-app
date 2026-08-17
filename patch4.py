import os

target_path = r"D:\myWork\gestro\automation\action_executor.py"

with open(target_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "from automation.application_controller import ApplicationController" in line and "action == \"SEARCH_APPS\"" not in line:
        # Check if we are inside SEARCH_APPS by looking at the indentation
        if line.strip() == "from automation.application_controller import ApplicationController":
            # Wait, let's just use replace on the whole file content to be safe
            pass
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

# Simpler way to replace
with open(target_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_snippet = """            elif action == "SEARCH_APPS":
                query = params.get("query", "").lower() if params else ""
                from automation.application_controller import ApplicationController
                all_apps = ApplicationController.get_installed_apps()"""

good_snippet = """            elif action == "SEARCH_APPS":
                query = params.get("query", "").lower() if params else ""
                all_apps = ApplicationController.get_installed_apps()"""

if bad_snippet in content:
    content = content.replace(bad_snippet, good_snippet)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched action_executor.py")
else:
    print("Snippet not found, maybe already patched?")
