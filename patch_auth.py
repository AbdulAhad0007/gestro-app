import os

GESTRO_DIR = r"D:\myWork\gestro"

# 1. Delete vision files (we are only removing the face scanning backend, not the auth system itself)
files_to_delete = [
    r"vision\face_auth_service.py",
    r"vision\facepp_client.py",
    r"vision\face_privacy.py",
    r"app\services\face_auth_service.py",
]

for file_path in files_to_delete:
    full_path = os.path.join(GESTRO_DIR, file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        print(f"Deleted {full_path}")
    else:
        print(f"File not found: {full_path}")

# 2. Rewrite face_auth_dialog.py to completely omit the camera step and face backend imports
auth_dialog_path = os.path.join(GESTRO_DIR, r"ui\dialogs\face_auth_dialog.py")

new_auth_dialog = """\"\"\"
Authentication Dialog (Password Only) for Gestro.
\"\"\"
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QPushButton, QMessageBox, 
    QLineEdit, QFormLayout, QStackedWidget, QWidget, QHBoxLayout
)
from PyQt6.QtCore import Qt

from profiles.profile_manager import profile_manager
from app.services.supabase_client import create_supabase_profile, verify_password_login

class FaceAuthDialog(QDialog):
    def __init__(self, parent=None, is_saving=False):
        super().__init__(parent)
        self.is_saving = is_saving
        self.setWindowTitle("Create Profile" if is_saving else "Login")
        self.setFixedSize(450, 450)
        
        self._setup_ui()
        
        if self.is_saving:
            self.stacked_widget.setCurrentWidget(self.page_create)
        else:
            self.stacked_widget.setCurrentWidget(self.page_login)
        
    def _setup_ui(self):
        main_layout = QVBoxLayout(self)
        self.stacked_widget = QStackedWidget()
        main_layout.addWidget(self.stacked_widget)
        
        # --- Page: Create Profile Form ---
        self.page_create = QWidget()
        create_layout = QVBoxLayout(self.page_create)
        
        create_layout.addWidget(QLabel("Enter your details to create a profile:"))
        
        form_layout = QFormLayout()
        self.inp_fullname = QLineEdit()
        self.inp_email = QLineEdit()
        
        pwd_layout = QHBoxLayout()
        pwd_layout.setContentsMargins(0, 0, 0, 0)
        self.inp_password = QLineEdit()
        self.inp_password.setEchoMode(QLineEdit.EchoMode.Password)
        self.btn_toggle_pwd = QPushButton("Show")
        self.btn_toggle_pwd.clicked.connect(lambda: self._toggle_password_visibility(self.inp_password, self.btn_toggle_pwd))
        pwd_layout.addWidget(self.inp_password)
        pwd_layout.addWidget(self.btn_toggle_pwd)

        self.inp_confirm_password = QLineEdit()
        self.inp_confirm_password.setEchoMode(QLineEdit.EchoMode.Password)
        
        form_layout.addRow("Full Name:", self.inp_fullname)
        form_layout.addRow("Email:", self.inp_email)
        form_layout.addRow("Password:", pwd_layout)
        form_layout.addRow("Confirm Password:", self.inp_confirm_password)
        create_layout.addLayout(form_layout)
        
        btn_layout = QHBoxLayout()
        self.btn_create_submit = QPushButton("Create Profile")
        self.btn_create_submit.clicked.connect(self.submit_create_profile)
        btn_layout.addWidget(self.btn_create_submit)
        
        self.btn_create_cancel = QPushButton("Cancel")
        self.btn_create_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(self.btn_create_cancel)
        create_layout.addLayout(btn_layout)
        
        self.stacked_widget.addWidget(self.page_create)
        
        # --- Page: Password Login Form ---
        self.page_login = QWidget()
        login_layout = QVBoxLayout(self.page_login)
        login_layout.addWidget(QLabel("Login with your Email and Password:"))
        
        login_form = QFormLayout()
        self.inp_login_email = QLineEdit()
        
        login_pwd_layout = QHBoxLayout()
        login_pwd_layout.setContentsMargins(0, 0, 0, 0)
        self.inp_login_password = QLineEdit()
        self.inp_login_password.setEchoMode(QLineEdit.EchoMode.Password)
        self.btn_toggle_login_pwd = QPushButton("Show")
        self.btn_toggle_login_pwd.clicked.connect(lambda: self._toggle_password_visibility(self.inp_login_password, self.btn_toggle_login_pwd))
        login_pwd_layout.addWidget(self.inp_login_password)
        login_pwd_layout.addWidget(self.btn_toggle_login_pwd)
        
        login_form.addRow("Email:", self.inp_login_email)
        login_form.addRow("Password:", login_pwd_layout)
        login_layout.addLayout(login_form)
        
        btn_login_layout = QHBoxLayout()
        self.btn_login_submit = QPushButton("Login")
        self.btn_login_submit.clicked.connect(self.submit_password_login)
        btn_login_layout.addWidget(self.btn_login_submit)
        
        self.btn_login_cancel = QPushButton("Cancel")
        self.btn_login_cancel.clicked.connect(self.reject)
        btn_login_layout.addWidget(self.btn_login_cancel)
        login_layout.addLayout(btn_login_layout)
        
        self.stacked_widget.addWidget(self.page_login)

    def submit_create_profile(self):
        fullname = self.inp_fullname.text().strip()
        email = self.inp_email.text().strip()
        password = self.inp_password.text().strip()
        confirm_pwd = self.inp_confirm_password.text().strip()
        
        if not fullname or not email or not password:
            QMessageBox.warning(self, "Error", "Full Name, Email, and Password are required.")
            return
            
        if password != confirm_pwd:
            QMessageBox.warning(self, "Error", "Passwords do not match.")
            return
            
        try:
            # We pass empty string for face_token since face login is removed
            profile = create_supabase_profile(fullname, email, password, "")
            if profile:
                profile_manager.start_persistent_session(profile.get("face_id", ""), profile["profile_name"], profile["user_id"])
                QMessageBox.information(self, "Success", "Your Gestro profile is now created and linked.")
                self.accept()
            else:
                QMessageBox.critical(self, "Error", "Failed to create profile in Supabase Auth. Check logs.")
        except Exception as e:
            error_str = str(e)
            QMessageBox.critical(self, "Error", f"Failed to create profile: {error_str}")

    def submit_password_login(self):
        email = self.inp_login_email.text().strip()
        password = self.inp_login_password.text().strip()
        
        if not email or not password:
            QMessageBox.warning(self, "Error", "Please enter both Email and Password.")
            return
            
        profile = verify_password_login(email, password)
        if profile:
            from database.database import get_db
            db = get_db()
            db.execute(
                \"\"\"INSERT OR IGNORE INTO user_profiles (profile_name, username, email, password_hash, profile_mode, face_id, user_id, is_active)
                   VALUES (?, ?, ?, ?, 'persistent', ?, ?, 1)\"\"\",
                (profile.get("profile_name", "User"), profile.get("email"), profile.get("email"), 
                 "supabase_auth", profile.get("face_id", ""), profile["user_id"])
            )
            db.commit()
            
            profile_manager.start_persistent_session(profile.get("face_id", ""), profile["profile_name"], profile["user_id"])
            QMessageBox.information(self, "Success", "Login successful.")
            self.accept()
        else:
            QMessageBox.warning(self, "Failed", "Invalid username or password.")
            
    def _toggle_password_visibility(self, line_edit, btn=None):
        if line_edit.echoMode() == QLineEdit.EchoMode.Password:
            line_edit.setEchoMode(QLineEdit.EchoMode.Normal)
            if btn: btn.setText("Hide")
        else:
            line_edit.setEchoMode(QLineEdit.EchoMode.Password)
            if btn: btn.setText("Show")
"""

with open(auth_dialog_path, "w", encoding="utf-8") as f:
    f.write(new_auth_dialog)
print(f"Rewrote {auth_dialog_path}")
