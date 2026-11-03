
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getLoggedInUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  };

  const getAuthConfig = (user) => ({
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  const updateStoredUser = (user, profileData) => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        ...profileData,
        token: user.token,
      })
    );
  };

  const loadProfile = async () => {
    const user = getLoggedInUser();

    if (!user?.token) {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/profile",
        getAuthConfig(user)
      );

      const data = response.data?.data;

      if (!data) {
        throw new Error(
          "Profile data was not returned by the server."
        );
      }

      const profileData = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        profileImage: data.profileImage || "",
      };

      setProfile(profileData);

      setFormData({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
      });

      updateStoredUser(user, profileData);
    } catch (err) {
      console.error("Profile loading error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleEdit = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });

    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const user = getLoggedInUser();

    if (!user?.token) {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const address = formData.address.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        "/profile",
        { name, email, phone, address },
        getAuthConfig(user)
      );

      const data = response.data?.data;

      const updatedProfile = {
        name: data?.name || name,
        email: data?.email || email,
        phone: data?.phone ?? phone,
        address: data?.address ?? address,
        profileImage:
          data?.profileImage ?? profile.profileImage,
      };

      setProfile(updatedProfile);

      setFormData({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
      });

      updateStoredUser(user, updatedProfile);

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      setSuccess("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5 MB.");
      setSuccess("");
      return;
    }

    const user = getLoggedInUser();

    if (!user?.token) {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const uploadData = new FormData();
      uploadData.append("profileImage", file);

      const response = await api.post(
        "/profile/upload-image",
        uploadData,
        getAuthConfig(user)
      );

      const imageUrl = response.data?.data?.profileImage;

      if (!imageUrl) {
        throw new Error(
          "The server did not return the image URL."
        );
      }

      setProfile((previous) => ({
        ...previous,
        profileImage: imageUrl,
      }));

      updateStoredUser(user, {
        profileImage: imageUrl,
      });

      setSuccess("Profile picture uploaded successfully.");
    } catch (err) {
      console.error("Profile picture upload error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to upload profile picture."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = profile.name || "User";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b100d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-70";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-300";

  return (
    <div className="min-h-screen bg-[#080b09] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-[#07100b]">
              ₹
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-xs text-gray-500">
                Manage your spending
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 sm:px-4"
            >
              <span className="sm:hidden">←</span>
              <span className="hidden sm:inline">
                ← Dashboard
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 sm:px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* PAGE INTRO */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-emerald-300"
          >
            ← Back to dashboard
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                Account settings
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Your Profile
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Manage your personal information and customise your
                account details.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Personal account
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 font-bold text-red-300">
              !
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-300">
                Something went wrong
              </p>
              <p className="mt-1 break-words text-sm text-red-200/80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="text-gray-500 transition hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 font-bold text-emerald-300">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-300">
                Success
              </p>
              <p className="mt-1 text-sm text-emerald-200/80">
                {success}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="text-gray-500 transition hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN PROFILE LAYOUT */}
        <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* LEFT PROFILE CARD */}
          <aside className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101713]">
            <div className="relative h-28 overflow-hidden bg-emerald-400/[0.06]">
              <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full border border-emerald-400/10" />
              <div className="absolute -right-1 -top-9 h-28 w-28 rounded-full border border-emerald-400/10" />
              <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-2xl" />
            </div>

            <div className="px-6 pb-6 sm:px-7">
              <div className="-mt-12 flex items-end justify-between gap-3">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-[#101713] bg-emerald-400 text-3xl font-bold text-[#07100b] shadow-xl shadow-black/20">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={`${displayName}'s profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials || "U"
                  )}
                </div>

                <div className="mb-1 flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Active
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfileImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                    Uploading photo...
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 4h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    Change profile photo
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-xs text-gray-500">
                JPG, PNG or WebP · Maximum 5 MB
              </p>

              <div className="mt-6">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 w-2/3 rounded-lg bg-white/10" />
                    <div className="h-4 w-full rounded-lg bg-white/[0.06]" />
                  </div>
                ) : (
                  <>
                    <h3 className="break-words text-2xl font-bold tracking-tight text-white">
                      {displayName}
                    </h3>
                    <p className="mt-2 break-all text-sm leading-6 text-gray-400">
                      {profile.email || "No email available"}
                    </p>
                  </>
                )}
              </div>

              <div className="my-6 border-t border-white/[0.08]" />

              {/* PROFILE DETAILS */}
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Full name
                    </p>
                    <p className="mt-1.5 break-words text-sm font-medium text-gray-200">
                      {loading
                        ? "Loading..."
                        : profile.name || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email address
                    </p>
                    <p className="mt-1.5 break-all text-sm font-medium text-gray-200">
                      {loading
                        ? "Loading..."
                        : profile.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Phone number
                    </p>
                    <p className="mt-1.5 break-words text-sm font-medium text-gray-200">
                      {loading
                        ? "Loading..."
                        : profile.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Address
                    </p>
                    <p className="mt-1.5 break-words text-sm leading-6 text-gray-200">
                      {loading
                        ? "Loading..."
                        : profile.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECURITY CARD */}
              <div className="mt-7 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      Account protected
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      Your password is not displayed or editable on this
                      page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT PERSONAL INFORMATION PANEL */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101713]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-6 sm:flex-row sm:items-center sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    Personal information
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {editing
                      ? "Update your information below."
                      : "Your current account information."}
                  </p>
                </div>
              </div>

              {!editing && !loading && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#07100b] transition hover:bg-emerald-300"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                  Edit profile
                </button>
              )}
            </div>

            <div className="p-5 sm:p-8">
              {loading ? (
                <div className="space-y-6">
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="space-y-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-sm font-semibold text-gray-200">
                      Your account details
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {editing
                        ? "Make your changes and save them when you're ready."
                        : "Select Edit profile whenever you need to update your details."}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing || saving}
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Enter your full name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className={labelClass}>
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!editing || saving}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(event) => {
                          const value = event.target.value;

                          if (/^[0-9]*$/.test(value)) {
                            handleChange(event);
                          }
                        }}
                        disabled={!editing || saving}
                        placeholder="10-digit phone number"
                        maxLength={10}
                        inputMode="numeric"
                        autoComplete="tel"
                        className={inputClass}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Enter a 10-digit number without spaces.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="address" className={labelClass}>
                        Address
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!editing || saving}
                        maxLength={250}
                        autoComplete="street-address"
                        placeholder="Enter your address"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-300">
                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-gray-200">
                          Keep your information up to date
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Your profile information helps keep your account
                          details accurate. Your password is managed
                          separately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.07] disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-7 py-3 text-sm font-bold text-[#07100b] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                            Saving changes...
                          </>
                        ) : (
                          <>
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            Save changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-white/[0.06] py-6 text-center">
          <p className="text-xs text-gray-500">
            Your money. Your goals. Your control.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Profile;
