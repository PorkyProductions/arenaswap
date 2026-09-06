import { defaultLocale, isLocaleCode, type LocaleCode } from './locales';
import en from './strings/en.json';
import de from './strings/de.json';
import es from './strings/es.json';
import fil from './strings/fil.json';
import fr from './strings/fr.json';
import it from './strings/it.json';
import ja from './strings/ja.json';
import ko from './strings/ko.json';
import ptBR from './strings/pt-BR.json';
import ptPT from './strings/pt-PT.json';
import zhCN from './strings/zh-CN.json';
import zhTW from './strings/zh-TW.json';

// Every bundle is imported eagerly, which is right for a static site: all of this runs in Astro
// frontmatter at build time and none of it reaches the browser. An island that needs a string is
// handed it as a prop rather than importing this.
const bundles: Record<LocaleCode, unknown> = {
	en,
	de,
	es,
	fil,
	fr,
	it,
	ja,
	ko,
	'pt-BR': ptBR,
	'pt-PT': ptPT,
	'zh-CN': zhCN,
	'zh-TW': zhTW,
};

export type SiteStrings = typeof en;

const lookup = (bundle: unknown, key: string): unknown =>
	key.split('.').reduce<unknown>(
		(node, segment) =>
			node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[segment] : undefined,
		bundle,
	);

const substitute = (value: string, subs?: Record<string, string | number>) => {
	if (!subs) return value;
	return Object.entries(subs).reduce(
		(text, [name, replacement]) => text.split(`{${name}}`).join(String(replacement)),
		value,
	);
};

// A missing key already fails loudly, because `useTranslations` throws rather than rendering the
// key. What it cannot see is a bundle that has drifted the other way: an extra key nothing reads,
// or a list that came back one item short. The lists are the dangerous half — `home.tabs.steps`,
// `powerscore.signals` and `home.leagues.numerals` are read by position, and a translator dropping
// an entry produces a page with a hole in it rather than an error.
//
// This runs once per build, in Astro frontmatter, and never reaches the browser.
const shapeOf = (node: unknown, prefix = ''): string[] => {
	if (Array.isArray(node)) {
		return [`${prefix}[${node.length}]`, ...node.flatMap((item, index) => shapeOf(item, `${prefix}[${index}]`))];
	}
	if (node !== null && typeof node === 'object') {
		return Object.entries(node as Record<string, unknown>)
			.flatMap(([key, value]) => shapeOf(value, prefix ? `${prefix}.${key}` : key));
	}
	return [prefix];
};

const englishShape = shapeOf(en).join('\n');

for (const [code, bundle] of Object.entries(bundles)) {
	if (code === defaultLocale) continue;
	const shape = shapeOf(bundle).join('\n');
	if (shape === englishShape) continue;

	const english = new Set(shapeOf(en));
	const theirs = new Set(shapeOf(bundle));
	const missing = [...english].filter(key => !theirs.has(key));
	const extra = [...theirs].filter(key => !english.has(key));
	throw new Error(
		`Locale bundle ${code}.json does not match en.json.`
		+ (missing.length > 0 ? `\n  Missing: ${missing.join(', ')}` : '')
		+ (extra.length > 0 ? `\n  Unexpected: ${extra.join(', ')}` : ''),
	);
}

// Re-exported so a page reaches for one module rather than two. The implementation sits next to
// the island translator, which is the other thing that needs it.
export { tokenize, type Slot } from './islandStrings';

export interface Translator {
	(key: string, subs?: Record<string, string | number>): string;
	// Some strings are lists — the FAQ questions, the steps on the landing page. Reading them as an
	// array beats numbering the keys, which is a count nobody remembers to keep in step.
	list: <T>(key: string) => T[];
	locale: LocaleCode;
}

// A missing key falls back to English rather than rendering the key itself. A locale that has not
// caught up with a new string then reads as an untranslated sentence, which is worse than nothing
// in exactly one language and unreadable in all of them the other way round.
export const useTranslations = (locale: LocaleCode): Translator => {
	const bundle = bundles[locale] ?? bundles[defaultLocale];

	const translate = ((key: string, subs?: Record<string, string | number>) => {
		const value = lookup(bundle, key) ?? lookup(bundles[defaultLocale], key);
		if (typeof value !== 'string') {
			throw new Error(`Missing site string: ${key}`);
		}
		return substitute(value, subs);
	}) as Translator;

	translate.list = <T,>(key: string): T[] => {
		const value = lookup(bundle, key) ?? lookup(bundles[defaultLocale], key);
		if (!Array.isArray(value)) {
			throw new Error(`Missing site string list: ${key}`);
		}
		return value as T[];
	};

	translate.locale = locale;
	return translate;
};

// `Astro.currentLocale` is derived from the URL by Astro's own i18n routing, so it is already
// correct on every page without a locale being threaded down through Nav, Footer and the rest.
// Validating it here means one place decides what happens when it is absent.
export const currentLocale = (candidate: string | undefined): LocaleCode =>
	isLocaleCode(candidate) ? candidate : defaultLocale;

const flatten = (node: unknown, prefix: string, into: Record<string, string>) => {
	if (node === null || typeof node !== 'object') return into;
	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'string') into[path] = value;
		else flatten(value, path, into);
	}
	return into;
};

// The shared components in @arenaswap/ui read a flat, dotted map — the same shape as their
// `defaultStrings`. The site's `ui` namespace mirrors the extension's own translations for those
// keys, so a demo popup on the German page reads the way the German extension does.
//
// English is laid down first and the locale over the top of it, so a key a locale has not caught
// up with yet falls back the same way `useTranslations` does rather than rendering as its own name.
export const uiStrings = (locale: LocaleCode): Record<string, string> => ({
	...flatten(lookup(bundles[defaultLocale], 'ui'), '', {}),
	...flatten(lookup(bundles[locale] ?? bundles[defaultLocale], 'ui'), '', {}),
});
