/**
 * useBrightChatMenuItems — React hook that generates IMenuOption entries
 * for the BrightChat dropdown menu, following the same pattern as
 * useBrightHubMenuItems in brighthub-react-components.
 *
 * Generates:
 *   1. "Direct Messages" link → /brightchat  (Home / DM view)
 *   2. Up to MAX_SERVERS dynamic server entries → /brightchat/server/:id
 *
 * A pure helper `generateBrightChatMenuOptions` is extracted for direct
 * property-based testing without React rendering.
 */

import type { IServer } from '@brightchain/brightchain-lib';
import type {
  IMenuOption,
  MenuType,
} from '@digitaldefiance/express-suite-react-components';
import { MenuTypes } from '@digitaldefiance/express-suite-react-components';
import { useMemo } from 'react';

/** Maximum number of servers shown in the menu. */
const MAX_SERVERS = 5;

/** Index increment between consecutive server menu items. */
const INDEX_STEP = 10;

/**
 * Pure helper that builds menu options from a server list.
 * Extracted so property-based tests can exercise the logic directly
 * without mounting a React component.
 *
 * Produces a "Direct Messages" entry first, then up to MAX_SERVERS
 * server entries. This replaces the old static Groups/Channels items
 * that didn't correspond to actual navigation targets in the layout.
 */
export function generateBrightChatMenuOptions(
  chatMenu: MenuType,
  servers: IServer<string>[],
  startingIndex: number,
  directMessagesLabel = 'Direct Messages',
): { options: IMenuOption[]; nextIndex: number } {
  const options: IMenuOption[] = [];

  // 1. Direct Messages — links to the Home / DM view
  options.push({
    id: 'brightchat-direct-messages',
    label: directMessagesLabel,
    link: '/brightchat',
    requiresAuth: true,
    includeOnMenus: [chatMenu, MenuTypes.SideMenu],
    index: startingIndex,
  });

  // 2. Dynamic server entries (capped at MAX_SERVERS)
  const capped = servers.slice(0, MAX_SERVERS);
  capped.forEach((server, i) => {
    options.push({
      id: `brightchat-server-${server.id}`,
      label: server.name,
      link: `/brightchat/server/${server.id}`,
      requiresAuth: true,
      includeOnMenus: [chatMenu, MenuTypes.SideMenu],
      index: startingIndex + (i + 1) * INDEX_STEP,
    });
  });

  return {
    options,
    nextIndex: startingIndex + (capped.length + 1) * INDEX_STEP,
  };
}

/**
 * React hook wrapping `generateBrightChatMenuOptions` in a `useMemo`.
 */
export function useBrightChatMenuItems(
  chatMenu: MenuType,
  servers: IServer<string>[],
  startingIndex: number,
  directMessagesLabel = 'Direct Messages',
): { options: IMenuOption[]; nextIndex: number } {
  return useMemo(
    () =>
      generateBrightChatMenuOptions(
        chatMenu,
        servers,
        startingIndex,
        directMessagesLabel,
      ),
    [chatMenu, servers, startingIndex, directMessagesLabel],
  );
}

export default useBrightChatMenuItems;
