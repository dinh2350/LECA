'use client';

import { usePathname, useRouter } from 'next/navigation';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
  { code: 'vi', label: 'Tiếng Việt' },
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLang = pathname.split('/')[1] || 'en';

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;

    if (!pathname) {
      router.push(`/${newLang}`);
      return;
    }

    const pathSegments = pathname.split('/');
    pathSegments[1] = newLang;
    const newPath = pathSegments.join('/');

    router.push(newPath);
  };

  return (
    <select
      value={currentLang}
      onChange={handleChange}
      className="min-w-[120px] rounded-md border border-white/50 bg-transparent px-3 py-1 text-sm text-inherit hover:border-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
    >
      {languages.map((lang) => (
        <option
          key={lang.code}
          value={lang.code}
          className="bg-[var(--color-surface)] text-[var(--color-foreground)]"
        >
          {lang.label}
        </option>
      ))}
    </select>
  );
}
