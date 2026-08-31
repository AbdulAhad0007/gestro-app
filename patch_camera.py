import os

target = r"D:\myWork\gestro\vision\camera_manager.py"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """        for idx in indices_to_try:
            # Try DSHOW first (faster init on most Windows machines)
            logger.info(f"Trying camera index {idx} with DSHOW...")
            test_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            time.sleep(0.3)  # Give the driver a moment to initialize
            if test_cap.isOpened():
                ret, _ = test_cap.read()
                if ret:
                    cap = test_cap
                    logger.info(f"Camera opened: index={idx}, backend=DSHOW")
                    break
                test_cap.release()
            else:
                test_cap.release()
            
            # Try default MSMF
            logger.info(f"Trying camera index {idx} with MSMF...")
            test_cap = cv2.VideoCapture(idx)
            time.sleep(0.5)  # MSMF needs slightly more warmup
            if test_cap.isOpened():
                ret, _ = test_cap.read()
                if ret:
                    cap = test_cap
                    logger.info(f"Camera opened: index={idx}, backend=MSMF")
                    break
                test_cap.release()
            else:
                test_cap.release()"""

new_logic = """        for idx in indices_to_try:
            # Try DSHOW first (faster init on most Windows machines)
            logger.info(f"Trying camera index {idx} with DSHOW...")
            test_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            
            # Apply performance settings early to prevent slow re-initialization
            test_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            test_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            test_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            time.sleep(0.1)  # Give the driver a moment to initialize
            if test_cap.isOpened():
                # Retry reading up to 10 times (1 second) to allow webcam warmup
                ret = False
                for _ in range(10):
                    ret, _ = test_cap.read()
                    if ret:
                        break
                    time.sleep(0.1)
                
                if ret:
                    cap = test_cap
                    logger.info(f"Camera opened: index={idx}, backend=DSHOW")
                    break
                test_cap.release()
            else:
                test_cap.release()
            
            # Try default MSMF
            logger.info(f"Trying camera index {idx} with MSMF...")
            test_cap = cv2.VideoCapture(idx)
            test_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            test_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            test_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            time.sleep(0.1)  # MSMF warmup
            if test_cap.isOpened():
                ret = False
                for _ in range(10):
                    ret, _ = test_cap.read()
                    if ret:
                        break
                    time.sleep(0.1)
                    
                if ret:
                    cap = test_cap
                    logger.info(f"Camera opened: index={idx}, backend=MSMF")
                    break
                test_cap.release()
            else:
                test_cap.release()"""

# Remove the late property setting since we do it early now
old_late_props = """        logger.info(f"Successfully opened camera.")
        # Apply performance settings to reduce CPU load
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        state_manager.set("camera_active", True)"""

new_late_props = """        logger.info(f"Successfully opened camera.")
        state_manager.set("camera_active", True)"""

if old_logic in content and old_late_props in content:
    content = content.replace(old_logic, new_logic)
    content = content.replace(old_late_props, new_late_props)
    
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched camera_manager.py successfully.")
else:
    print("Could not find the target code to patch in camera_manager.py")
