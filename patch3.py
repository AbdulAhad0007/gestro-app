import os

file_path = 'd:/myWork/gestro/automation/application_controller.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_content = """    @staticmethod
    def get_installed_apps() -> list:
        \"\"\"Returns a list of installed applications from common Start Menu locations.\"\"\"
        apps = []
        try:
            import os
            import win32com.client
            
            shell = win32com.client.Dispatch("WScript.Shell")"""

replacement_content = """    _cached_apps = None
    _last_cache_time = 0

    @classmethod
    def get_installed_apps(cls) -> list:
        \"\"\"Returns a list of installed applications from common Start Menu locations.\"\"\"
        import time
        current_time = time.time()
        if cls._cached_apps is not None and (current_time - cls._last_cache_time) < 300: # 5 minutes cache
            return cls._cached_apps

        apps = []
        try:
            import os
            import win32com.client
            
            shell = win32com.client.Dispatch("WScript.Shell")"""

content = content.replace(target_content, replacement_content)

# We also need to change the return to set the cache
target_return = """            return sorted(apps, key=lambda x: x['name'])
        except Exception as e:
            logger.error(f"Failed to get installed apps: {e}")
            return []"""

replacement_return = """            cls._cached_apps = sorted(apps, key=lambda x: x['name'])
            cls._last_cache_time = current_time
            return cls._cached_apps
        except Exception as e:
            logger.error(f"Failed to get installed apps: {e}")
            return []"""

content = content.replace(target_return, replacement_return)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully!')
