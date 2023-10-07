import {
  BEGIN_CONFIG_LIST_MARKER,
  END_CONFIG_LIST_MARKER,
} from './comment-markers.js';
import { markdownTable } from 'markdown-table';
import type { ConfigsToRules, ConfigEmojis, Plugin } from './types.js';
import { ConfigFormat, configNameToDisplay } from './config-format.js';

function generateConfigListMarkdown(
  plugin: Plugin,
  configsToRules: ConfigsToRules,
  pluginPrefix: string,
  configEmojis: ConfigEmojis,
  configFormat: ConfigFormat,
  ignoreConfig: readonly string[]
): string {
  /* istanbul ignore next -- configs are sure to exist at this point */
  const configs = Object.values(plugin.configs || {});
  const hasDescription = configs.some(
    // @ts-expect-error -- description is not an official config property.
    (config) => config.description
  );
  const listHeaderRow = ['', 'Name'];
  if (hasDescription) {
    listHeaderRow.push('Description');
  }

  return markdownTable(
    [
      listHeaderRow,
      ...Object.keys(configsToRules)
        .filter((configName) => !ignoreConfig.includes(configName))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .map((configName) => {
          return [
            configEmojis.find((obj) => obj.config === configName)?.emoji || '',
            `\`${configNameToDisplay(
              configName,
              configFormat,
              pluginPrefix
            )}\``,
            hasDescription
              ? // @ts-expect-error -- description is not an official config property.
                (plugin.configs?.[configName]?.description as
                  | string
                  | undefined) || ''
              : undefined,
          ].filter((col) => col !== undefined);
        }),
    ],
    { align: 'l' } // Left-align headers.
  );
}

export function updateConfigsList(
  markdown: string,
  plugin: Plugin,
  configsToRules: ConfigsToRules,
  pluginPrefix: string,
  configEmojis: ConfigEmojis,
  configFormat: ConfigFormat,
  ignoreConfig: readonly string[]
): string {
  const listStartIndex = markdown.indexOf(BEGIN_CONFIG_LIST_MARKER);
  let listEndIndex = markdown.indexOf(END_CONFIG_LIST_MARKER);

  if (listStartIndex === -1 || listEndIndex === -1) {
    // No config list found.
    return markdown;
  }

  if (
    Object.keys(configsToRules).filter(
      (configName) => !ignoreConfig.includes(configName)
    ).length === 0
  ) {
    // No non-ignored configs found.
    return markdown;
  }

  // Account for length of pre-existing marker.
  listEndIndex += END_CONFIG_LIST_MARKER.length;

  const preList = markdown.slice(0, Math.max(0, listStartIndex));
  const postList = markdown.slice(Math.max(0, listEndIndex));

  // New config list.
  const list = generateConfigListMarkdown(
    plugin,
    configsToRules,
    pluginPrefix,
    configEmojis,
    configFormat,
    ignoreConfig
  );

  return `${preList}${BEGIN_CONFIG_LIST_MARKER}\n\n${list}\n\n${END_CONFIG_LIST_MARKER}${postList}`;
}