import { ListGroupMembers } from "~/components/auth/ListGroupMembers";
import { Suspense } from "react";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <main>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
        <div>
          <a
            href="/auth/group"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Back to groups
          </a>
        </div>
        <h1 className="text-2xl font-semibold">Group Members</h1>
        <Suspense fallback={<p>Loading...</p>}>
          <ListGroupMembers groupId={id} />
        </Suspense>
      </div>
    </main>
  );
};

export default Page;
