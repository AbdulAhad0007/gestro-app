import sys

file_path = 'd:/myWork/gestro/automation/action_executor.py'
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace('success = True            elif action == "START_SEARCH":', 'success = True\n            elif action == "START_SEARCH":')

with open(file_path, 'w') as f:
    f.write(content)
print('Fixed!')
