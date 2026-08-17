import win32gui
import win32process
import psutil

def enum_windows_callback(hwnd, windows):
    if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd):
        rect = win32gui.GetWindowRect(hwnd)
        width = rect[2] - rect[0]
        height = rect[3] - rect[1]
        
        if width > 0 and height > 0:
            exe_name = ""
            try:
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                process = psutil.Process(pid)
                exe_name = process.name()
            except Exception:
                pass
            
            windows.append({
                "id": hwnd,
                "title": win32gui.GetWindowText(hwnd),
                "process_name": exe_name,
                "width": width,
                "height": height
            })

windows = []
win32gui.EnumWindows(enum_windows_callback, windows)

print(f"Total visible windows: {len(windows)}")
for win in windows[:5]:
    print(win)
