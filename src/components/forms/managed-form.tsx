"use client";

import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagedFormProps {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  successMessage: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
}

export function ManagedForm({
  action,
  children,
  className,
  successMessage,
  confirmMessage,
  resetOnSuccess = false,
}: ManagedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formData = new FormData(event.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      try {
        await action(formData);
        if (resetOnSuccess) formRef.current?.reset();
        setFeedback({ type: "success", message: successMessage });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo completar la acción.",
        });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className}>
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>

      {isPending && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Procesando…
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className={cn(
            "mt-2 flex animate-in items-center gap-2 rounded-md px-3 py-2 text-xs",
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </p>
      )}
    </form>
  );
}
