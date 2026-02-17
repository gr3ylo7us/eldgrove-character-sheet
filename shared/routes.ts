import { z } from 'zod';
import { insertCharacterSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
};

export const api = {
  characters: {
    list: { method: 'GET' as const, path: '/api/characters' as const, responses: { 200: z.any() } },
    get: { method: 'GET' as const, path: '/api/characters/:id' as const, responses: { 200: z.any(), 404: errorSchemas.notFound } },
    create: { method: 'POST' as const, path: '/api/characters' as const, input: insertCharacterSchema, responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/characters/:id' as const, input: insertCharacterSchema.partial(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/characters/:id' as const, responses: { 204: z.void() } },
  },
  data: {
    weapons: { method: 'GET' as const, path: '/api/data/weapons' as const, responses: { 200: z.any() } },
    armor: { method: 'GET' as const, path: '/api/data/armor' as const, responses: { 200: z.any() } },
    items: { method: 'GET' as const, path: '/api/data/items' as const, responses: { 200: z.any() } },
    skills: { method: 'GET' as const, path: '/api/data/skills' as const, responses: { 200: z.any() } },
    archetypes: { method: 'GET' as const, path: '/api/data/archetypes' as const, responses: { 200: z.any() } },
    feats: { method: 'GET' as const, path: '/api/data/feats' as const, responses: { 200: z.any() } },
    maneuvers: { method: 'GET' as const, path: '/api/data/maneuvers' as const, responses: { 200: z.any() } },
    languages: { method: 'GET' as const, path: '/api/data/languages' as const, responses: { 200: z.any() } },
    leveling: { method: 'GET' as const, path: '/api/data/leveling' as const, responses: { 200: z.any() } },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
