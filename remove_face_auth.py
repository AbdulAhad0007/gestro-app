import os
import re

GESTRO_DIR = r"D:\myWork\gestro"

# 1. Delete Files
files_to_delete = [
    r"vision\face_auth_service.py",
    r"vision\facepp_client.py",
    r"vision\face_privacy.py",
    r"app\services\face_auth_service.py",
    r"ui\dialogs\face_auth_dialog.py",
]

for file_path in files_to_delete:
    full_path = os.path.join(GESTRO_DIR, file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        print(f"Deleted {full_path}")
    else:
        print(f"File not found: {full_path}")

# 2. Modify app_controller.py
app_controller_path = os.path.join(GESTRO_DIR, r"app\core\app_controller.py")
with open(app_controller_path, "r", encoding="utf-8") as f:
    app_controller_content = f.read()

old_auth_check = """            # 4. Profile
            # Check for an active persistent profile
            db = get_db()
            active_profile = db.fetchone("SELECT * FROM user_profiles WHERE is_active = 1 AND profile_mode = 'persistent'")
            if active_profile:
                profile = profile_manager.start_persistent_session(
                    active_profile["face_id"], 
                    active_profile["profile_name"], 
                    active_profile["user_id"]
                )
            else:
                profile = profile_manager.start_temporary_session()"""

new_auth_check = """            # 4. Profile
            profile = profile_manager.start_temporary_session()"""

if old_auth_check in app_controller_content:
    app_controller_content = app_controller_content.replace(old_auth_check, new_auth_check)
    print("Modified app_controller.py (Auth Check)")
else:
    print("WARNING: Could not find old_auth_check in app_controller.py")

with open(app_controller_path, "w", encoding="utf-8") as f:
    f.write(app_controller_content)


# 3. Modify main_window.py
main_window_path = os.path.join(GESTRO_DIR, r"ui\main_window.py")
with open(main_window_path, "r", encoding="utf-8") as f:
    main_window_content = f.read()

handlers_to_remove = """    def _handle_login_request(self) -> None:
        from ui.dialogs.face_auth_dialog import FaceAuthDialog
        from profiles.profile_manager import profile_manager
        from app.config.settings_manager import settings_manager
        
        dialog = FaceAuthDialog(self, is_saving=False)
        if dialog.exec() == 1:
            profile = profile_manager.get_active_profile()
            if profile:
                self.update_profile_display(profile.display_name, "Persistent Session")
                # Refresh UI based on user's saved settings
                theme_manager.set_theme(settings_manager.theme)
                signals.profile_changed.emit(profile.mode)

    def _handle_signup_request(self) -> None:
        from ui.dialogs.face_auth_dialog import FaceAuthDialog
        from profiles.profile_manager import profile_manager
        from app.config.settings_manager import settings_manager
        
        dialog = FaceAuthDialog(self, is_saving=True)
        if dialog.exec() == 1:
            profile = profile_manager.get_active_profile()
            if profile:
                self.update_profile_display(profile.display_name, "Persistent Session")
                # Refresh UI based on user's saved settings
                theme_manager.set_theme(settings_manager.theme)
                signals.profile_changed.emit(profile.mode)"""

if handlers_to_remove in main_window_content:
    main_window_content = main_window_content.replace(handlers_to_remove, "")
    print("Modified main_window.py (Removed handlers)")
else:
    print("WARNING: Could not find handlers_to_remove in main_window.py")

signals_to_remove = """        self.sidebar.login_requested.connect(self._handle_login_request)
        self.sidebar.signup_requested.connect(self._handle_signup_request)"""

if signals_to_remove in main_window_content:
    main_window_content = main_window_content.replace(signals_to_remove, "")
    print("Modified main_window.py (Removed signals)")
else:
    print("WARNING: Could not find signals_to_remove in main_window.py")

with open(main_window_path, "w", encoding="utf-8") as f:
    f.write(main_window_content)


# 4. Modify sidebar.py
sidebar_path = os.path.join(GESTRO_DIR, r"ui\components\sidebar.py")
with open(sidebar_path, "r", encoding="utf-8") as f:
    sidebar_content = f.read()

buttons_to_remove = """        self.btn_login = QPushButton("Login")
        self.btn_login.setObjectName("btnLogin")
        self.btn_login.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_login.clicked.connect(self.login_requested.emit)
        button_layout.addWidget(self.btn_login)

        self.btn_signup = QPushButton("Sign Up")
        self.btn_signup.setObjectName("btnSignup")
        self.btn_signup.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_signup.clicked.connect(self.signup_requested.emit)
        button_layout.addWidget(self.btn_signup)

        self.btn_logout = QPushButton("Logout")
        self.btn_logout.setObjectName("btnLogout")
        self.btn_logout.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_logout.clicked.connect(self.logout_requested.emit)
        self.btn_logout.hide()
        button_layout.addWidget(self.btn_logout)"""

new_buttons = """        self.btn_logout = QPushButton("Logout")
        self.btn_logout.setObjectName("btnLogout")
        self.btn_logout.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_logout.clicked.connect(self.logout_requested.emit)
        self.btn_logout.hide()
        button_layout.addWidget(self.btn_logout)"""

if buttons_to_remove in sidebar_content:
    sidebar_content = sidebar_content.replace(buttons_to_remove, new_buttons)
    print("Modified sidebar.py (Removed login/signup buttons)")
else:
    print("WARNING: Could not find buttons_to_remove in sidebar.py")

update_profile_old = """    def update_profile(self, name: str, mode: str) -> None:
        \"\"\"Update the profile display.\"\"\"
        self._profile_name.setText(name)
        self._profile_mode.setText(mode)
        if "Persistent" in mode:
            self.btn_login.hide()
            self.btn_signup.hide()
            self.btn_logout.show()
        else:
            self.btn_login.show()
            self.btn_signup.show()
            self.btn_logout.hide()"""

update_profile_new = """    def update_profile(self, name: str, mode: str) -> None:
        \"\"\"Update the profile display.\"\"\"
        self._profile_name.setText(name)
        self._profile_mode.setText(mode)
        if "Persistent" in mode:
            self.btn_logout.show()
        else:
            self.btn_logout.hide()"""

if update_profile_old in sidebar_content:
    sidebar_content = sidebar_content.replace(update_profile_old, update_profile_new)
    print("Modified sidebar.py (Update profile visibility)")
else:
    print("WARNING: Could not find update_profile_old in sidebar.py")

style_to_remove = """            #btnLogin, #btnSignup {{
                background-color: {t.accent};
                color: {t.accent_text};
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: bold;
                margin-top: 4px;
            }}
            #btnLogin:hover, #btnSignup:hover {{
                background-color: {t.accent_muted};
                color: {t.accent};
            }}"""

if style_to_remove in sidebar_content:
    sidebar_content = sidebar_content.replace(style_to_remove, "")
    print("Modified sidebar.py (Removed styles)")
else:
    print("WARNING: Could not find style_to_remove in sidebar.py")

signals_def_to_remove = """    login_requested = pyqtSignal()
    logout_requested = pyqtSignal()
    signup_requested = pyqtSignal()"""

signals_def_new = """    logout_requested = pyqtSignal()"""

if signals_def_to_remove in sidebar_content:
    sidebar_content = sidebar_content.replace(signals_def_to_remove, signals_def_new)
    print("Modified sidebar.py (Removed signal defs)")
else:
    print("WARNING: Could not find signals_def_to_remove in sidebar.py")

with open(sidebar_path, "w", encoding="utf-8") as f:
    f.write(sidebar_content)
