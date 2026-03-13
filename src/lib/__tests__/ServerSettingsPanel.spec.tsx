/**
 * Unit tests for ServerSettingsPanel component.
 *
 * Tests tab rendering, role assignment controls, and settings save API call.
 *
 * Requirements: 8.1, 8.2, 8.4
 */

const DefaultRoleEnum = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const;

jest.mock('@brightchain/brightchain-lib', () => ({
  PresenceStatus: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    IDLE: 'idle',
    DO_NOT_DISTURB: 'dnd',
  },
  DefaultRole: DefaultRoleEnum,
}));

// Mock useI18n to avoid requiring I18nProvider in tests
jest.mock('@digitaldefiance/express-suite-react-components', () => ({
  useI18n: () => ({
    tComponent: (_componentId: string, key: string) => key,
    tBranded: (key: string) => key,
  }),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ServerSettingsPanel from '../ServerSettingsPanel';
import type { ServerSettingsPanelProps } from '../ServerSettingsPanel';

// ─── Helpers ────────────────────────────────────────────────────────────────

const testServer = {
  id: 'srv-1',
  name: 'Test Server',
  iconUrl: 'https://example.com/icon.png',
  ownerId: 'u1',
  memberIds: ['u1', 'u2'],
  channelIds: ['ch-1'],
  categories: [
    { id: 'cat-1', name: 'General', position: 0, channelIds: ['ch-1'] },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testMembers = [
  { id: 'u1', displayName: 'Alice (Owner)', role: DefaultRoleEnum.OWNER as any },
  { id: 'u2', displayName: 'Bob (Member)', role: DefaultRoleEnum.MEMBER as any },
];

const testInvites = [
  {
    token: 'abc123def456ghi789',
    serverId: 'srv-1',
    createdBy: 'u1',
    createdAt: new Date(),
    currentUses: 3,
    maxUses: 10,
  },
];

function renderPanel(overrides: Partial<ServerSettingsPanelProps> = {}) {
  const defaultProps: ServerSettingsPanelProps = {
    open: true,
    onClose: jest.fn(),
    server: testServer,
    members: testMembers,
    invites: testInvites,
    currentUserRole: DefaultRoleEnum.OWNER as any,
    onUpdateServer: jest.fn().mockResolvedValue(undefined),
    onAssignRole: jest.fn().mockResolvedValue(undefined),
    onRemoveMember: jest.fn().mockResolvedValue(undefined),
    onCreateInvite: jest.fn().mockResolvedValue({
      token: 'new-token-xyz',
      serverId: 'srv-1',
      createdBy: 'u1',
      createdAt: new Date(),
      currentUses: 0,
    }),
    onCreateCategory: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return {
    ...render(<ServerSettingsPanel {...defaultProps} />),
    props: defaultProps,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ServerSettingsPanel', () => {
  it('renders the panel title and server name (Req 8.1)', () => {
    renderPanel();
    expect(screen.getByText('Server_Settings_Title')).toBeTruthy();
    expect(screen.getByText('Test Server')).toBeTruthy();
  });

  it('renders all four tabs (Req 8.2)', () => {
    renderPanel();
    expect(screen.getByText('Server_Settings_Overview')).toBeTruthy();
    expect(screen.getByText('Server_Settings_Members')).toBeTruthy();
    expect(screen.getByText('Server_Settings_Categories')).toBeTruthy();
    expect(screen.getByText('Server_Settings_Invites')).toBeTruthy();
  });

  it('shows Overview tab content by default with Server Name and Icon URL fields', () => {
    renderPanel();
    expect(screen.getByLabelText(/Server_Settings_ServerNameLabel/i)).toBeTruthy();
    expect(screen.getByLabelText(/Server_Settings_IconUrlLabel/i)).toBeTruthy();
    expect(screen.getByText('Server_Settings_Save')).toBeTruthy();
  });

  it('calls onUpdateServer when Save is clicked (Req 8.3)', async () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByText('Server_Settings_Save'));

    await waitFor(() => {
      expect(props.onUpdateServer).toHaveBeenCalled();
    });
  });

  it('switches to Members tab and shows member list (Req 8.4)', () => {
    renderPanel();

    fireEvent.click(screen.getByText('Server_Settings_Members'));

    expect(screen.getByText('Alice (Owner)')).toBeTruthy();
    expect(screen.getByText('Bob (Member)')).toBeTruthy();
  });

  it('shows role assignment dropdowns for owner (Req 8.4)', () => {
    renderPanel({ currentUserRole: DefaultRoleEnum.OWNER as any });

    fireEvent.click(screen.getByText('Server_Settings_Members'));

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('hides role assignment dropdowns for non-owner', () => {
    renderPanel({ currentUserRole: DefaultRoleEnum.ADMIN as any });

    fireEvent.click(screen.getByText('Server_Settings_Members'));

    const selects = screen.queryAllByRole('combobox');
    expect(selects.length).toBe(0);
  });

  it('switches to Categories tab and shows categories', () => {
    renderPanel();

    fireEvent.click(screen.getByText('Server_Settings_Categories'));

    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('1 Server_Settings_ChannelCount')).toBeTruthy();
  });

  it('switches to Invites tab and shows invite list', () => {
    renderPanel();

    fireEvent.click(screen.getByText('Server_Settings_Invites'));

    expect(screen.getByText('Server_Settings_GenerateInvite')).toBeTruthy();
    expect(screen.getByText('Server_Settings_Uses 3/10')).toBeTruthy();
  });

  it('calls onCreateInvite when Generate Invite is clicked', async () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByText('Server_Settings_Invites'));
    fireEvent.click(screen.getByText('Server_Settings_GenerateInvite'));

    await waitFor(() => {
      expect(props.onCreateInvite).toHaveBeenCalled();
    });
  });

  it('does not render when open is false', () => {
    renderPanel({ open: false });
    expect(screen.queryByText('Server_Settings_Title')).toBeNull();
  });
});
