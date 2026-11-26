import { useEffect, useRef, useState } from "react";
import { useForm, usePage, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";

export default function Edit() {
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="My Profile" />

            <div className="w-full max-w-2xl mx-auto space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <UpdateProfileForm user={user} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <UpdatePasswordForm />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <DeleteAccountForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function UpdateProfileForm({ user }) {
    const fileInput = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(
        user.profile_image ? `/storage/${user.profile_image}` : null,
    );

    const {
        data,
        setData,
        post,
        transform,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        profile_image: null,
    });

    useEffect(() => {
        if (!data.profile_image) {
            setPreviewUrl(
                user.profile_image ? `/storage/${user.profile_image}` : null,
            );
            return;
        }

        const objectUrl = URL.createObjectURL(data.profile_image);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.profile_image, user.profile_image]);

    const submit = (e) => {
        e.preventDefault();

        // Use POST + method spoofing so PHP/Laravel reliably receives
        // multipart file uploads for this PATCH route.
        transform((formData) => ({
            ...formData,
            _method: "patch",
        }));

        post(route("profile.update"), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData("profile_image", null);
                if (fileInput.current) {
                    fileInput.current.value = "";
                }
            },
        });
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-gray-900">
                    Profile Information
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Manage your personal details and profile photo.
                </p>
            </header>

            <form onSubmit={submit} className="mt-5 space-y-5">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#FFE4EE] bg-gradient-to-br from-[#FFF0F5] to-[#FFD6E7] text-2xl font-bold text-[#D93668]">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt={`${user.full_name || "User"} profile`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            user.full_name
                                ?.trim()
                                ?.charAt(0)
                                ?.toUpperCase() || <i className="fas fa-user" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                            Profile Photo
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Choose a clear photo so other users can recognize
                            your account.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <input
                                ref={fileInput}
                                id="profile_image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) =>
                                    setData(
                                        "profile_image",
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />

                            <button
                                type="button"
                                onClick={() => fileInput.current?.click()}
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-full bg-[#FFF0F5] px-4 py-2 text-xs font-semibold text-[#D93668] transition hover:bg-[#FFE4EE] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <i className="fas fa-upload" />
                                {data.profile_image
                                    ? "Change Photo"
                                    : "Upload Photo"}
                            </button>

                            <span className="text-xs text-gray-400">
                                JPG, PNG or WebP · Maximum 2 MB
                            </span>
                        </div>

                        {data.profile_image && (
                            <p className="mt-2 truncate text-xs text-gray-600">
                                Selected: {data.profile_image.name}
                            </p>
                        )}
                        <InputError
                            message={errors.profile_image}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="full_name" value="Full Name" />
                    <TextInput
                        id="full_name"
                        className="mt-1 block w-full"
                        value={data.full_name}
                        onChange={(e) => setData("full_name", e.target.value)}
                        required
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.full_name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? "Saving..." : "Save Changes"}
                    </PrimaryButton>

                    {recentlySuccessful && (
                        <p className="text-sm text-green-600">
                            Profile updated successfully.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}

function UpdatePasswordForm() {
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-gray-900">
                    Update Password
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Use a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={submit} className="mt-5 space-y-5">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />
                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? "Saving..." : "Save Password"}
                    </PrimaryButton>

                    {recentlySuccessful && (
                        <p className="text-sm text-green-600">Saved.</p>
                    )}
                </div>
            </form>
        </section>
    );
}

function DeleteAccountForm() {
    const passwordInput = useRef(null);
    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-gray-900">
                    Delete Account
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Once deleted, all data for this account will be permanently
                    removed. Accounts with recorded stock transactions cannot be
                    deleted.
                </p>
            </header>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                    <InputLabel
                        htmlFor="delete_account_password"
                        value="Password"
                        className="sr-only"
                    />
                    <TextInput
                        id="delete_account_password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        type="password"
                        className="block w-full sm:w-3/4"
                        placeholder="Confirm your password to delete your account"
                    />
                    <InputError message={errors.password} className="mt-2" />
                    <InputError message={errors.account} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center rounded-full border border-transparent bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
                >
                    {processing ? "Deleting..." : "Delete Account"}
                </button>
            </form>
        </section>
    );
}
