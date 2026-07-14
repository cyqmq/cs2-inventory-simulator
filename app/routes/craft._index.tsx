import { faLink } from "@fortawesome/free-solid-svg-icons";
import { CS2BaseInventoryItem, CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import lzstring from "lz-string";
import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import {
  useInventory,
  useRules,
  useTranslate,
  useUser
} from "~/components/app-context";
import { CraftEdit } from "~/components/craft-edit";
import { CraftImportInspectLink } from "~/components/craft-import-inspect-link";
import { CraftNew } from "~/components/craft-new";
import { CraftShareUser } from "~/components/craft-share-user";
import { CraftView } from "~/components/craft-view";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useLockScroll } from "~/components/hooks/use-lock-scroll";
import { useSync } from "~/components/hooks/use-sync";
import { ItemEditorAttributes } from "~/components/item-editor";
import { ItemPicker } from "~/components/item-picker";
import { Modal, ModalHeader } from "~/components/modal";
import { SyncAction } from "~/data/sync";
import { apiGet } from "~/api-client";
import { isItemCountable } from "~/utils/economy";
import {
  createFakeInventoryItemFromBase,
  editInventoryItem
} from "~/utils/inventory";
import { tryOrDefault } from "~/utils/misc";
import { range } from "~/utils/number";
import { baseInventoryItemProps } from "~/utils/shapes";
import { playSound } from "~/utils/sound";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const share = url.searchParams.get("share");
  const uidStr = url.searchParams.get("uid");

  let shared: { item: Record<string, unknown>; user?: unknown } | undefined;
  if (share !== null) {
    try {
      const decompressed = JSON.parse(
        lzstring.decompressFromEncodedURIComponent(share) || "{}"
      );
      let user: unknown = undefined;
      if (decompressed.u) {
        try {
          user = await apiGet<unknown>(`/api/user/basic/${decompressed.u}`);
        } catch {
          user = undefined;
        }
      }
      shared = {
        item: decompressed.i || {},
        user
      };
    } catch {
      shared = undefined;
    }
  }

  return {
    shared,
    uid: uidStr !== null ? Number(uidStr) : undefined
  };
}

clientLoader.hydrate = true;

export default function Craft() {
  const { uid, shared } = useLoaderData<typeof clientLoader>();

  const isEditing = uid !== undefined;
  const isSharing = shared?.item !== undefined;
  const isCrafting = !isEditing && !isSharing;

  const translate = useTranslate();
  const sync = useSync();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const user = useUser();

  const { craftAllowImportInspectLink } = useRules();
  const [inventory, setInventory] = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportFromInspectLink, setIsImportFromInspectLink] = useState(false);
  const [item, setItem] = useState<CS2EconomyItem | undefined>(
    isEditing
      ? tryOrDefault(() => inventory.get(uid))
      : isSharing
        ? createFakeInventoryItemFromBase(shared.item as unknown as CS2BaseInventoryItem)
        : undefined
  );

  useLockScroll();

  function handleSubmit({ quantity, ...attributes }: ItemEditorAttributes) {
    if (isSubmitting || item === undefined) {
      return;
    }

    playSound("inventory_new_item_accept");
    setIsSubmitting(true);

    if (isEditing) {
      setInventory(editInventoryItem(inventory, uid, attributes));
      sync({
        type: SyncAction.Edit,
        uid,
        attributes
      } as Record<string, unknown>);
      return navigate("/");
    }

    const inventoryItem = {
      ...attributes,
      id: item.id,
      statTrak: attributes.statTrak ? (0 as const) : undefined
    } satisfies CS2BaseInventoryItem;

    range(isItemCountable(item) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      } as Record<string, unknown>);
    });
    return navigate("/");
  }

  function handleClose() {
    if (isEditing || isSharing) {
      return navigate("/");
    }
    return setItem(undefined);
  }

  function handleImportFromInspectLinkOpen() {
    setIsImportFromInspectLink(true);
  }

  function handleImportFromInspectLinkClose() {
    setIsImportFromInspectLink(false);
  }

  function handleInspectLinkImport(item: CS2BaseInventoryItem) {
    setIsImportFromInspectLink(false);
    setItem(createFakeInventoryItemFromBase(item));
  }

  const editorProps =
    item !== undefined
      ? {
          item,
          onSubmit: handleSubmit,
          onClose: handleClose
        }
      : undefined;
  const hasItem = editorProps !== undefined;

  const CraftComponent = isEditing
    ? CraftEdit
    : isSharing
      ? CraftView
      : CraftNew;

  return (
    <>
      {isCrafting && (
        <Modal className={clsx(isDesktop ? "max-w-180 min-w-160" : "w-135")}>
          <ModalHeader title={translate("CraftSelectHeader")} closeTo="/" />
          <ItemPicker
            navItems={[
              user !== undefined &&
                craftAllowImportInspectLink && {
                  icon: faLink,
                  isActive: isImportFromInspectLink,
                  label: translate("CraftImportNavLabel"),
                  onClick: handleImportFromInspectLinkOpen
                }
            ]}
            onPickItem={setItem}
          />
        </Modal>
      )}
      {hasItem && (
        <Modal className="w-fit">
          <ModalHeader
            title={translate(
              isSharing ? "CraftSharedHeader" : "CraftConfirmHeader"
            )}
            onClose={handleClose}
          />
          {shared?.user !== undefined && <CraftShareUser user={shared.user as { avatar: string; name: string }} />}
          <CraftComponent {...editorProps} />
        </Modal>
      )}
      {isImportFromInspectLink && (
        <Modal className="w-105">
          <CraftImportInspectLink
            onImport={handleInspectLinkImport}
            onClose={handleImportFromInspectLinkClose}
          />
        </Modal>
      )}
    </>
  );
}
