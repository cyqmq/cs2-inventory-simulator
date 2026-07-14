import { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import { usePostFetcher } from "~/components/hooks/use-post-fetcher";
import { ApiActionImportInspectLinkUrl } from "~/data/api-urls";

export function useImportInspectLinkFetcher() {
  const fetcher = usePostFetcher<CS2BaseInventoryItem>(
    ApiActionImportInspectLinkUrl
  );
  return {
    ...fetcher,
    submit: (inspectLink: string) => fetcher.submit({ inspectLink })
  };
}
