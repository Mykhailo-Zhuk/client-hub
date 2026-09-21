import { Card } from '@/components/ui/card';
import { renderSafeMarkdown } from '@/lib/sanitize';
import { timeAgo } from '@/lib/utils';

type Comment = {
  id: string;
  type: string;
  author: string;
  message: string;
  timestamp: string;
  parent_id?: string | null;
};

export default function CommentThread({
  comments,
}: {
  comments: Comment[];
}) {
  if (comments.length === 0) {
    return (
      <Card className="p-6 text-xs text-muted-foreground">
        No updates yet. Post the first one using the editor below — or hit
        <code className="mx-1 rounded bg-muted px-1">/reply</code>
        from Telegram to draft one with AI.
      </Card>
    );
  }

  // Group by parent_id for thread visualization
  const top: Comment[] = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) =>
    comments.filter((c) => c.parent_id === id);

  return (
    <ol className="space-y-3">
      {top.map((c) => {
        const kids = childrenOf(c.id);
        return (
          <li key={c.id}>
            <Card className="p-4">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
                    {c.type}
                  </span>
                  <span className="font-medium text-foreground/80">
                    {c.author}
                  </span>
                </div>
                <span>{timeAgo(c.timestamp)}</span>
              </div>
              <div
                className="mt-2 prose prose-sm dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(c.message) }}
              />
            </Card>
            {kids.length > 0 && (
              <ol className="ml-6 mt-2 space-y-2 border-l border-accent/30 pl-4">
                {kids.map((k) => (
                  <li key={k.id}>
                    <Card className="p-3 text-sm">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          ↳ {k.author}
                        </span>
                        <span>{timeAgo(k.timestamp)}</span>
                      </div>
                      <div
                        className="mt-1 prose prose-sm dark:prose-invert max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(k.message) }}
                      />
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}
