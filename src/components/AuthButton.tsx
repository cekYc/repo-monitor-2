"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface User {
  login: string;
  avatarUrl: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* Kullanıcı avatarı ve adı */}
        <Image
          src={user.avatarUrl}
          alt={user.login}
          width={28}
          height={28}
          className="rounded-full ring-2 ring-gray-300 dark:ring-gray-600"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.login}
        </span>

        {/* Çıkış formu — CSRF koruması için POST kullanıyoruz */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600
                       hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400
                       dark:hover:bg-gray-800 transition-colors"
          >
            Çıkış
          </button>
        </form>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/signin"
      className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium
                 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900
                 dark:hover:bg-gray-200 transition-colors"
    >
      {/* GitHub SVG ikonu */}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-current"
        aria-hidden="true"
      >
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
                 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466
                 -.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832
                 .092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688
                 -.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0
                 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028
                 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012
                 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
      </svg>
      GitHub ile Giriş Yap
    </a>
  );
}