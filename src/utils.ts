import * as path from 'path';
import * as fse from 'fs-extra';

type TemplateVars = Record<string, string>;

/**
 * Replace {{var}} in file contents
 */
async function replaceInFile(
    filePath: string,
    vars: Record<string, string>
) {
    const stat = await fse.stat(filePath);
    if (!stat.isFile()) return;

    // Skip binary files
    const binaryExtensions = [
        '.png', '.jpg', '.jpeg', '.gif',
        '.ico', '.exe', '.pdf'
    ];
    if (binaryExtensions.includes(path.extname(filePath))) return;

    let content = await fse.readFile(filePath, 'utf8');
    let changed = false;

    content = content.replace(/{{([^}]+)}}/g, (full, inner) => {
        for (const [key, value] of Object.entries(vars)) {

            // normalize placeholder to snake_case
            const normalized = inner
                .replace(/[A-Z]/g, (m: string) => `_${m.toLowerCase()}`)
                .replace(/^_/, '');

            if (normalized !== key) continue;

            changed = true;

            // 1️⃣ UPPER_SNAKE_CASE
            if (inner === inner.toUpperCase()) {
                return value.toUpperCase();
            }

            // 2️⃣ PascalCase
            if (/^[A-Z][a-zA-Z0-9]*$/.test(inner)) {
                return toPascalCase(value);
            }

            // 3️⃣ camelCase
            if (/^[a-z][a-zA-Z0-9]*$/.test(inner) && inner !== key) {
                return toCamelCase(value);
            }

            // 4️⃣ snake_case / lowercase
            return value;
        }

        return full;
    });

    if (changed) {
        await fse.writeFile(filePath, content, 'utf8');
    }
}


/**
 * Replace {{var}} in file/folder names
 */
function replaceInName(
    name: string,
    vars: Record<string, string>
): string {
    return name.replace(/{{([^}]+)}}/g, (full, inner) => {
        for (const [key, value] of Object.entries(vars)) {

            // normalize placeholder to snake_case
            const normalized = inner
                .replace(/[A-Z]/g, (m: string) => `_${m.toLowerCase()}`)
                .replace(/^_/, '');

            if (normalized !== key) continue;

            // 1️⃣ UPPER_SNAKE_CASE
            if (inner === inner.toUpperCase()) {
                return value.toUpperCase();
            }

            // 2️⃣ PascalCase
            if (/^[A-Z][a-zA-Z0-9]*$/.test(inner)) {
                return toPascalCase(value);
            }

            // 3️⃣ camelCase
            if (/^[a-z][a-zA-Z0-9]*$/.test(inner) && inner !== key) {
                return toCamelCase(value);
            }

            // 4️⃣ snake_case (including single-word lowercase)
            return value;
        }

        return full;
    });
}

/**
 * Recursive post-order traversal
 */
export async function walkAndReplace(
    dir: string,
    vars: TemplateVars
) {
    const entries = await fse.readdir(dir, { withFileTypes: true });

    // 1️⃣ Process children first
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await walkAndReplace(fullPath, vars);
        } else {
            await replaceInFile(fullPath, vars);
        }
    }

    // 2️⃣ Rename files/folders AFTER children
    for (const entry of entries) {
        const newName = replaceInName(entry.name, vars);
        if (newName === entry.name) continue;

        const oldPath = path.join(dir, entry.name);
        const newPath = path.join(dir, newName);

        await fse.move(oldPath, newPath, { overwrite: true });
    }
}

export function snakeToPascal(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function snakeToCamel(str: string): string {
  return toCamelCase(str);
}

export function pascalToSnakeSmart(str: string): string {
    const allowedTwoLetterWords = new Set([
        'if', 'in', 'is', 'it', 'on', 'up', 'do', 'to', 'at', 'by', 'of', 'or', 'as', 'he', 'me', 'we', 'my', 'no', 'so'
    ]);

    // Match word boundaries for PascalCase + acronyms
    const words = str.match(
        /([A-Z]+(?=[A-Z][a-z])|[A-Z][a-z]+|[A-Z]+)/g
    );

    if (!words) return str.toLowerCase();

    const result: string[] = [];
    let i = 0;

    while (i < words.length) {
        let word = words[i];

        // If the word is 2 letters and not allowed, merge with next word
        if (word.length === 2 && !allowedTwoLetterWords.has(word.toLowerCase()) && i + 1 < words.length) {
            word += words[i + 1];
            i++; // Skip the next word since it's merged
        }

        result.push(word.toLowerCase());
        i++;
    }

    return result.join('_');
}

export function pascalToCamel(str: string): string {
    if (!str) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(str: string): string {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}
