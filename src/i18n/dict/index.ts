import { en as baseEn } from './en';
import { ar as baseAr } from './ar';
import authEn from './partials/auth.en';
import authAr from './partials/auth.ar';
import customerEn from './partials/customer.en';
import customerAr from './partials/customer.ar';
import driverEn from './partials/driver.en';
import driverAr from './partials/driver.ar';
import adminEn from './partials/admin.en';
import adminAr from './partials/admin.ar';
import { mobileCustomerEn } from './partials/mobile-customer.en';
import { mobileCustomerAr } from './partials/mobile-customer.ar';
import { mobileDriverEn } from './partials/mobile-driver.en';
import { mobileDriverAr } from './partials/mobile-driver.ar';
import { landingEn } from './partials/landing.en';
import { landingAr } from './partials/landing.ar';

export type Lang = 'en' | 'ar';
export const LANGS: Lang[] = ['en', 'ar'];

function deepMerge(...objs: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = deepMerge(out[k], v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

export const en = deepMerge(baseEn, authEn, customerEn, driverEn, adminEn, mobileDriverEn, mobileCustomerEn, landingEn);
export const ar = deepMerge(baseAr, authAr, customerAr, driverAr, adminAr, mobileDriverAr, mobileCustomerAr, landingAr);

export const dictionaries: Record<Lang, Record<string, unknown>> = { en, ar };

export type Dict = typeof en;

export function translate(key: string, vars?: Record<string, string | number> | null, lang: Lang = 'en'): string {
  const dict = dictionaries[lang];
  const value = lookup(dict, key);
  if (value === undefined) return key;
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (m, name: string) => String(vars[name] ?? m));
}

function lookup(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function getNestedKeys(obj: unknown, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...getNestedKeys(v, path));
    else out.push(path);
  }
  return out;
}
