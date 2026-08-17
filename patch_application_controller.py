import os

target_path = r"D:\myWork\gestro\automation\application_controller.py"

with open(target_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_snippet = '''    @classmethod
    def get_installed_apps(cls) -> list:
        """Returns a list of installed applications from common Start Menu locations."""
        import time
        current_time = time.time()
        if cls._cached_apps is not None and (current_time - cls._last_cache_time) < 300: # 5 minutes cache
            return cls._cached_apps

        apps = []
        try:
            import os
            import win32com.client
            
            shell = win32com.client.Dispatch("WScript.Shell")
            
            # Common paths for shortcuts
            paths_to_scan = [
                os.path.join(os.environ.get('ProgramData', 'C:\\\\ProgramData'), r'Microsoft\\Windows\\Start Menu\\Programs'),
                os.path.join(os.environ.get('APPDATA', ''), r'Microsoft\\Windows\\Start Menu\\Programs')
            ]
            
            seen_names = set()
            for path in paths_to_scan:
                if not os.path.exists(path):
                    continue
                for root, _, files in os.walk(path):
                    for file in files:
                        if file.lower().endswith('.lnk'):
                            full_path = os.path.join(root, file)
                            name = os.path.splitext(file)[0]
                            
                            # Filter out common uninstallers or help files
                            name_lower = name.lower()
                            if any(x in name_lower for x in ['uninstall', 'help', 'readme', 'manual', 'documentation']):
                                continue
                                
                            if name in seen_names:
                                continue
                                
                            try:
                                shortcut = shell.CreateShortCut(full_path)
                                target = shortcut.Targetpath
                                if target and target.lower().endswith('.exe'):
                                    apps.append({
                                        "name": name,
                                        "path": full_path,
                                        "exe": os.path.basename(target)
                                    })
                                    seen_names.add(name)
                            except Exception:
                                pass
            
            cls._cached_apps = sorted(apps, key=lambda x: x['name'])
            cls._last_cache_time = current_time
            return cls._cached_apps
        except Exception as e:
            logger.error(f"Failed to get installed apps: {e}")
            return []'''

good_snippet = '''    @classmethod
    def get_installed_apps(cls) -> list:
        """Returns a list of installed applications from common Start Menu locations."""
        import time
        current_time = time.time()
        if cls._cached_apps is not None and (current_time - cls._last_cache_time) < 300: # 5 minutes cache
            return cls._cached_apps

        apps = []
        try:
            import os
            
            # Common paths for shortcuts
            paths_to_scan = [
                os.path.join(os.environ.get('ProgramData', 'C:\\\\ProgramData'), r'Microsoft\\Windows\\Start Menu\\Programs'),
                os.path.join(os.environ.get('APPDATA', ''), r'Microsoft\\Windows\\Start Menu\\Programs')
            ]
            
            seen_names = set()
            for path in paths_to_scan:
                if not os.path.exists(path):
                    continue
                for root, _, files in os.walk(path):
                    for file in files:
                        if file.lower().endswith('.lnk'):
                            full_path = os.path.join(root, file)
                            name = os.path.splitext(file)[0]
                            
                            # Filter out common uninstallers or help files
                            name_lower = name.lower()
                            if any(x in name_lower for x in ['uninstall', 'help', 'readme', 'manual', 'documentation']):
                                continue
                                
                            if name in seen_names:
                                continue
                                
                            apps.append({
                                "name": name,
                                "path": full_path,
                                "exe": file
                            })
                            seen_names.add(name)
            
            cls._cached_apps = sorted(apps, key=lambda x: x['name'])
            cls._last_cache_time = current_time
            return cls._cached_apps
        except Exception as e:
            logger.error(f"Failed to get installed apps: {e}")
            return []'''

if bad_snippet in content:
    content = content.replace(bad_snippet, good_snippet)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched application_controller.py")
else:
    print("Snippet not found, maybe already patched or text differs?")
