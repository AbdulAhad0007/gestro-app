import sys
import re

file_path = 'd:/myWork/gestro/automation/action_executor.py'
with open(file_path, 'r') as f:
    content = f.read()

replacement = '''            elif action == "START_SEARCH":
                import ctypes, time
                VK_LWIN = 0x5B
                ctypes.windll.user32.keybd_event(VK_LWIN, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_LWIN, 0, 2, 0)
                time.sleep(0.3)
                if params and "query" in params:
                    keyboard.write(params["query"])
                success = True
            elif action == "SEARCH_APPS":
                query = params.get("query", "").lower() if params else ""
                from automation.application_controller import ApplicationController
                all_apps = ApplicationController.get_installed_apps()
                if query:
                    response_data = [app for app in all_apps if query in app['name'].lower()]
                else:
                    response_data = []
                response_data = response_data[:20]
                success = True
            elif action == "APP_ACTION":
                if params and "path" in params and "action_type" in params:
                    path = params["path"]
                    action_type = params["action_type"]
                    import os, subprocess, ctypes
                    try:
                        if action_type == "open":
                            os.startfile(path)
                            success = True
                        elif action_type == "runas":
                            ctypes.windll.shell32.ShellExecuteW(None, "runas", path, None, None, 1)
                            success = True
                        elif action_type == "location":
                            subprocess.Popen(f'explorer /select,"{path}"')
                            success = True
                    except Exception as e:
                        logger.error(f"Failed to execute APP_ACTION {action_type}: {e}")
                        success = False'''

content = re.sub(
    r'(\s*elif action == "START_SEARCH":\s*import ctypes, time\s*VK_LWIN = 0x5B\s*ctypes\.windll\.user32\.keybd_event\(VK_LWIN, 0, 0, 0\)\s*ctypes\.windll\.user32\.keybd_event\(VK_LWIN, 0, 2, 0\)\s*time\.sleep\(0\.3\)\s*if params and "query" in params:\s*keyboard\.write\(params\["query"\]\)\s*success = True)',
    replacement,
    content,
    flags=re.MULTILINE
)

with open(file_path, 'w') as f:
    f.write(content)
print('Done!')
