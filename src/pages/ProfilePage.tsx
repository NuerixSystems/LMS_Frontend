import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  BookOpen,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLMS } from "../context/LMSContext";
import { Input, PasswordInput } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout, changePassword } = useAuth();
  const { totalEnrolledCount, completedCount, inProgressCount } = useLMS();
  const navigate = useNavigate();

  // Profile info state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, bio });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword, confirmNewPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(res.error || "Failed to update password.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account information, credentials, and track your progress.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-3xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1.5 ring-2 ring-white">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.name || "Student"}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {user?.createdAt || "Recently"}</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-600 pt-1 max-w-xl">{user?.bio}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">Enrolled</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalEnrolledCount}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">Completed</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Profile Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Update your personal display name and email</CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="h-4 w-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <Button type="submit" size="md" className="w-full font-medium">
                Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Password has been changed successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <PasswordInput
                label="New Password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="outline" size="md" className="w-full font-medium">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions / Logout Section */}
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-red-900">Sign Out</h3>
          <p className="text-xs text-red-700/80">
            Log out of your current session on this device.
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="md"
          className="gap-2 font-medium shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};