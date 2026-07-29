"use client";

import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Correo institucional</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="analista@dnl.example.co"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-dnl-red)]"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-dnl-red)]"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
      </div>
      {state.error && <p className="text-xs text-rose-600 dark:text-rose-400">{state.error}</p>}
      <SubmitButton className="w-full">Iniciar sesión</SubmitButton>
    </form>
  );
}
