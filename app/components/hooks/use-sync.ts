import { useUser } from "~/components/app-context";
import type { ActionShape } from "~/data/sync-types";
import { pushToSync } from "~/sync";

export function useSync() {
  const user = useUser();
  return async function useSync(data: ActionShape) {
    if (user !== undefined) {
      pushToSync(data);
    }
  };
}
