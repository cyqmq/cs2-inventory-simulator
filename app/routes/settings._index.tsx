/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate, useSubmit } from "react-router";
import {
  useInventory,
  usePreferences,
  useRules,
  useTranslate
} from "~/components/app-context";
import { EditorRange } from "~/components/editor-range";
import { EditorToggle } from "~/components/editor-toggle";
import { useCheckbox } from "~/components/hooks/use-checkbox";
import { useStorageState } from "~/components/hooks/use-storage-state";
import { useSync } from "~/components/hooks/use-sync";
import { LanguageSelect } from "~/components/language-select";
import { Modal, ModalHeader } from "~/components/modal";
import { ModalButton } from "~/components/modal-button";
import { confirm } from "~/components/modal-generic";
import { Select } from "~/components/select";
import { SettingsLabel } from "~/components/settings-label";
import { backgrounds } from "~/data/backgrounds";
import { languages } from "~/data/languages";
import { SyncAction } from "~/data/sync";
import { ApiActionPreferencesUrl } from "~/data/api-urls";
import { getApiBaseUrl, setApiBaseUrl as setClientApiBaseUrl } from "~/api-client";

export default function Settings() {
  const {
    background: selectedBackground,
    hideFilters: selectedHideFilters,
    hideFreeItems: selectedHideFreeItems,
    hideNewItemLabel: selectedHideNewItemLabel,
    language: selectedLanguage,
    prefer2dStickerEditor: selectedPrefer2dStickerEditor,
    statsForNerds: selectedStatsForNerds
  } = usePreferences();
  const { viewerEnabled } = useRules();
  const [inventory, setInventory] = useInventory();
  const translate = useTranslate();
  const sync = useSync();

  const [background, setBackground] = useState(selectedBackground ?? "");
  const [hideFilters, setHideFilters] = useCheckbox(selectedHideFilters);
  const [hideFreeItems, setHideFreeItems] = useCheckbox(selectedHideFreeItems);
  const [hideNewItemLabel, setHideNewItemLabel] = useCheckbox(
    selectedHideNewItemLabel
  );
  const [language, setLanguage] = useState(selectedLanguage);
  const [prefer2dStickerEditor, setPrefer2dStickerEditor] = useCheckbox(
    selectedPrefer2dStickerEditor
  );
  const [statsForNerds, setStatsForNerds] = useCheckbox(selectedStatsForNerds);
  const [volume, setVolume] = useStorageState("appVolume", 1);

  const [serverUrl, setServerUrl] = useState("");
  const [configPath, setConfigPath] = useState("");
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.getApiBaseUrl().then(setServerUrl);
      window.electronAPI.getConfigPath().then(setConfigPath);
    }
  }, []);

  async function handleSaveServerUrl() {
    if (window.electronAPI && serverUrl) {
      await window.electronAPI.setApiBaseUrl(serverUrl);
      setClientApiBaseUrl(serverUrl);
    }
  }

  const submit = useSubmit();
  const navigate = useNavigate();

  function handleSubmit() {
    submit(
      {
        background,
        hideFilters,
        hideFreeItems,
        hideNewItemLabel,
        language,
        prefer2dStickerEditor,
        statsForNerds
      },
      {
        action: ApiActionPreferencesUrl,
        method: "POST"
      }
    );
  }

  async function handleRemoveAllItems() {
    if (
      await confirm({
        titleText: translate("SettingsRemoveAllItems"),
        bodyText: translate("SettingsConfirmRemoveAllItems"),
        cancelText: translate("EditorCancel"),
        confirmText: translate("GenericOK")
      })
    ) {
      inventory.removeAll();
      setInventory(inventory);
      sync({ type: SyncAction.RemoveAllItems });
      return navigate("/");
    }
  }

  return (
    <Modal className="w-135">
      <ModalHeader title={translate("SettingsHeader")} closeTo="/" />
      <div className="mt-2 space-y-2 px-2">
        <SettingsLabel label={translate("SettingsMasterVolume")}>
          <EditorRange
            format={(value) => (value * 100).toFixed(0).toString()}
            max={1}
            min={0}
            onChange={setVolume}
            step={0.01}
            value={volume}
            valueStyles="w-5 text-right"
          />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsLanguage")}>
          <LanguageSelect
            languages={languages.map(({ name, countries }) => ({
              name,
              country: countries[0]
            }))}
            value={language}
            onChange={setLanguage}
          />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsBackground")}>
          <Select
            value={background ?? ""}
            onChange={setBackground}
            options={[
              {
                label: translate("SettingsBackgroundRandom"),
                value: ""
              },
              ...backgrounds
            ]}
            children={({ label }) => label}
          />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsStatsForNerds")}>
          <EditorToggle checked={statsForNerds} onChange={setStatsForNerds} />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsHideFreeItems")}>
          <EditorToggle checked={hideFreeItems} onChange={setHideFreeItems} />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsHideFilters")}>
          <EditorToggle checked={hideFilters} onChange={setHideFilters} />
        </SettingsLabel>
        <SettingsLabel label={translate("SettingsHideNewLabel")}>
          <EditorToggle
            checked={hideNewItemLabel}
            onChange={setHideNewItemLabel}
          />
        </SettingsLabel>
        {viewerEnabled && (
          <SettingsLabel label={translate("SettingsPrefer2dStickerEditor")}>
            <EditorToggle
              checked={prefer2dStickerEditor}
              onChange={setPrefer2dStickerEditor}
            />
          </SettingsLabel>
        )}
        {isElectron && (
          <div className="space-y-2 rounded-sm border border-neutral-500/20 bg-neutral-800/50 p-3">
            <SettingsLabel label="后端服务器地址">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="flex-1 rounded-sm bg-neutral-700 px-2 py-1 text-sm text-white outline-none ring-1 ring-neutral-600 focus:ring-blue-500"
                  placeholder="http://localhost:3000"
                />
                <button
                  onClick={handleSaveServerUrl}
                  className="rounded-sm bg-blue-600 px-3 py-1 text-sm text-white transition-all hover:bg-blue-500"
                >
                  保存
                </button>
              </div>
            </SettingsLabel>
            {configPath && (
              <p className="text-xs text-neutral-400">
                配置文件路径：{configPath}
              </p>
            )}
          </div>
        )}
        {inventory.size() > 0 && (
          <button
            className="font-display flex h-12 w-full cursor-default items-center gap-3 rounded-sm border border-neutral-500/20 bg-neutral-800/50 px-3 py-1 text-red-500 transition-all hover:ring-2 hover:ring-red-500"
            onClick={handleRemoveAllItems}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4" />
            {translate("SettingsRemoveAllItems")}
          </button>
        )}
      </div>
      <div className="my-6 flex justify-center gap-2 px-4">
        <ModalButton
          children={translate("SettingsSave")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </Modal>
  );
}
