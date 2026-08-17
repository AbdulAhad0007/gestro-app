import sys
import os

sys.path.append(r"D:\myWork\gestro")

from automation.application_controller import ApplicationController

print("Testing get_installed_apps:")
try:
    apps = ApplicationController.get_installed_apps()
    print(f"Apps count: {len(apps)}")
    if apps:
        print(apps[:2])
except Exception as e:
    print(f"Error getting apps: {e}")

print("\nTesting get_open_windows:")
try:
    windows = ApplicationController.get_open_windows()
    print(f"Windows count: {len(windows)}")
    if windows:
        print(windows[:2])
except Exception as e:
    print(f"Error getting windows: {e}")
