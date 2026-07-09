"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteStartup } from "@/lib/actions";

const DeleteStartupButton = ({ startupId }: { startupId: string }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete this startup pitch? This cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteStartup(startupId);

      if (result.status === "SUCCESS") {
        toast({
          title: "Deleted",
          description: "Your startup pitch has been deleted",
        });
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not delete this startup",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete startup"
      className="flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-4 py-1.5 font-medium text-14-normal !text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="size-4" />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
};

export default DeleteStartupButton;
