import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GroupGoal, Contribution } from "../lib/chatService";
import { mockUsers } from "../data/mockData";
import { format } from "date-fns";
import { UserAvatar } from "./UserAvatar";

interface PerformanceBoardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GroupGoal;
}

export default function PerformanceBoard({
  open,
  onOpenChange,
  goal,
}: PerformanceBoardProps) {
  // Gruppiere Beiträge nach Benutzer
  const contributionsByUser = (goal.contributions || []).reduce((acc, contribution) => {
    if (!acc[contribution.userId]) {
      acc[contribution.userId] = {
        totalProgress: 0,
        contributions: [],
      };
    }
    acc[contribution.userId].totalProgress += contribution.progress;
    acc[contribution.userId].contributions.push(contribution);
    return acc;
  }, {} as Record<number, { totalProgress: number; contributions: Contribution[] }>);

  // Sortiere Benutzer nach Gesamtbeitrag (absteigend)
  const sortedUsers = Object.entries(contributionsByUser)
    .sort(([, a], [, b]) => b.totalProgress - a.totalProgress)
    .map(([userId, data]) => ({
      user: mockUsers.find(u => u.id === parseInt(userId)),
      ...data,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Performance Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Gruppenziel: {goal.title}
          </div>
          <div className="space-y-3">
            {sortedUsers.map(({ user, totalProgress, contributions }) => (
              user && (
                <div key={user.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={user.id}
                        avatar={user.avatar}
                        username={user.username}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Gesamt: {totalProgress}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-10 space-y-1">
                    {contributions.map((c, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        +{c.progress}% am {format(new Date(c.timestamp), 'dd.MM.yyyy HH:mm')}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}