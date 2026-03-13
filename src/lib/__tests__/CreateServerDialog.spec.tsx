/**
 * Unit tests for CreateServerDialog component.
 *
 * Tests dialog open/close, validation error display, and API error
 * display without closing the dialog.
 *
 * Requirements: 5.1, 5.4
 */

jest.mock('@brightchain/brightchain-lib', () => ({
  PresenceStatus: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    IDLE: 'idle',
    DO_NOT_DISTURB: 'dnd',
  },
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
import CreateServerDialog from '../CreateServerDialog';
import type { CreateServerDialogProps } from '../CreateServerDialog';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockServer = {
  id: 'server-1',
  name: 'Test Server',
  ownerId: 'user-1',
  memberIds: ['user-1'],
  channelIds: ['ch-1'],
  categories: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderDialog(overrides: Partial<CreateServerDialogProps> = {}) {
  const defaultProps: CreateServerDialogProps = {
    open: true,
    onClose: jest.fn(),
    onCreated: jest.fn(),
    createServer: jest.fn().mockResolvedValue(mockServer),
    ...overrides,
  };
  return { ...render(<CreateServerDialog {...defaultProps} />), props: defaultProps };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CreateServerDialog', () => {
  it('renders the dialog when open is true (Req 5.1)', () => {
    renderDialog({ open: true });
    expect(screen.getByText('Create_Server_Title')).toBeTruthy();
    expect(screen.getByLabelText(/Create_Server_NameLabel/i)).toBeTruthy();
  });

  it('does not render dialog content when open is false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Create_Server_Title')).toBeNull();
  });

  it('calls onClose when Cancel is clicked', () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByText('Create_Server_Cancel'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('shows validation error when submitting a name that is too long', async () => {
    renderDialog();

    const nameInput = screen.getByLabelText(/Create_Server_NameLabel/i);
    const longName = 'A'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });

    fireEvent.click(screen.getByText('Create_Server_Submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/Create_Server_NameTooLong/i),
      ).toBeTruthy();
    });
  });

  it('calls createServer and onCreated on successful submit', async () => {
    const createServer = jest.fn().mockResolvedValue(mockServer);
    const onCreated = jest.fn();
    const onClose = jest.fn();

    renderDialog({ createServer, onCreated, onClose });

    const nameInput = screen.getByLabelText(/Create_Server_NameLabel/i);
    fireEvent.change(nameInput, { target: { value: 'My Server' } });

    fireEvent.click(screen.getByText('Create_Server_Submit'));

    await waitFor(() => {
      expect(createServer).toHaveBeenCalledWith({
        name: 'My Server',
        iconUrl: undefined,
      });
      expect(onCreated).toHaveBeenCalledWith(mockServer);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays API error without closing dialog on failure (Req 5.4)', async () => {
    const createServer = jest
      .fn()
      .mockRejectedValue(new Error('Server limit reached'));
    const onClose = jest.fn();

    renderDialog({ createServer, onClose });

    const nameInput = screen.getByLabelText(/Create_Server_NameLabel/i);
    fireEvent.change(nameInput, { target: { value: 'My Server' } });

    fireEvent.click(screen.getByText('Create_Server_Submit'));

    await waitFor(() => {
      expect(screen.getByText('Server limit reached')).toBeTruthy();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Create_Server_Title')).toBeTruthy();
  });
});
