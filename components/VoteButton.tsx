"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toggleVote } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  startupId: string;
  initialVoted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

const VoteButton = ({
  startupId,
  initialVoted,
  initialCount,
  isLoggedIn,
}: VoteButtonProps) => {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to vote for this startup",
      });
      router.push("/login");
      return;
    }

    const previousVoted = voted;
    const previousCount = count;
    const nextVoted = !voted;

    setVoted(nextVoted);
    setCount(nextVoted ? previousCount + 1 : previousCount - 1);

    startTransition(async () => {
      const result = await toggleVote(startupId);

      if (result.status !== "SUCCESS") {
        setVoted(previousVoted);
        setCount(previousCount);
        toast({
          title: "Error",
          description: result.error || "Could not update your vote",
          variant: "destructive",
        });
        return;
      }

      setVoted(result.voted);
      setCount(result.voteCount);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={voted ? "Remove your vote" : "Vote for this startup"}
      className={cn(
        "flex items-center gap-1 rounded-full border-2 border-black px-3 py-1.5 font-medium text-14-normal transition-colors disabled:opacity-60",
        voted ? "bg-primary text-white" : "bg-white text-black",
      )}
    >
      <ArrowBigUp className={cn("size-4", voted && "fill-white")} />
      {count}
    </button>
  );
};

export default VoteButton;
