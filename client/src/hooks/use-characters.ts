import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertCharacter, Character } from "@shared/schema";

export function useCharacters() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [api.characters.list.path],
    queryFn: async () => {
      const res = await fetch(api.characters.list.path, { credentials: "include" });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Failed to fetch characters",
          description: "The scrolls are unreadable currently."
        });
        throw new Error("Failed to fetch characters");
      }
      return api.characters.list.responses[200].parse(await res.json());
    },
  });
}

export function useCharacter(id: number) {
  const { toast } = useToast();

  return useQuery({
    queryKey: [api.characters.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.characters.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Character not found",
          description: "This hero has been lost to the void."
        });
        throw new Error("Failed to fetch character");
      }
      return api.characters.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const res = await fetch(api.characters.create.path, {
        method: api.characters.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to create character");
      }
      return api.characters.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.characters.list.path] });
      toast({
        title: "Hero Born",
        description: "A new legend begins their journey.",
        className: "bg-primary text-primary-foreground border-primary/50 font-display",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "The ink would not take to the page."
      });
    }
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertCharacter>) => {
      const url = buildUrl(api.characters.update.path, { id });
      const res = await fetch(url, {
        method: api.characters.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update character");
      return api.characters.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.characters.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.characters.get.path, data.id] });
      toast({
        title: "Chronicle Updated",
        description: "The hero's story changes.",
        className: "bg-primary/10 border-primary/50 font-display",
      });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.characters.delete.path, { id });
      const res = await fetch(url, { method: api.characters.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete character");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.characters.list.path] });
      toast({
        title: "Fallen Hero",
        description: "Their memory fades into legend.",
        variant: "destructive",
      });
    },
  });
}
