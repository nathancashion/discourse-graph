import { ListGroups } from "~/components/auth/ListGroups";
import { Suspense } from "react";

const Page = () => (
  <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <Suspense fallback={<>Loading</>}>
      <ListGroups />
    </Suspense>
  </div>
);

export default Page;
