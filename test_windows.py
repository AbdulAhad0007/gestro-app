import sys
import pygetwindow as gw

windows = gw.getAllWindows()
print(f"Total windows before filter: {len(windows)}")
for win in windows[:10]:
    print(f"Title: '{win.title}', visible: {win.visible}, width: {win.width}, height: {win.height}")
