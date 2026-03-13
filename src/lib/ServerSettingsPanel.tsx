/**
 * ServerSettingsPanel — MUI Drawer with tabs for managing Server settings.
 *
 * Tabs: Overview, Members, Categories, Invites.
 * Hidden from non-owner/non-admin users (enforced by parent).
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
import type {
  IServer,
  IServerCategory,
  IServerInviteToken,
} from '@brightchain/brightchain-lib';
import { DefaultRole } from '@brightchain/brightchain-lib';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  ChangeEvent,
  FC,
  memo,
  SyntheticEvent,
  useCallback,
  useState,
} from 'react';
import { BrightChatStrings } from '@brightchain/brightchat-lib';
import { useI18n } from '@digitaldefiance/express-suite-react-components';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MemberInfo {
  id: string;
  displayName: string;
  role: DefaultRole;
}

export interface ServerSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  server: IServer | null;
  members: MemberInfo[];
  invites: IServerInviteToken[];
  currentUserRole: DefaultRole | null;
  onUpdateServer: (params: {
    name?: string;
    iconUrl?: string;
  }) => Promise<void>;
  onAssignRole: (memberId: string, role: DefaultRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onCreateInvite: (params?: {
    maxUses?: number;
    expiresInMs?: number;
  }) => Promise<IServerInviteToken>;
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

// ─── Tab Panel helper ───────────────────────────────────────────────────────

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ p: 2, flex: 1, overflow: 'auto' }}
    >
      {value === index && children}
    </Box>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 400;

const ServerSettingsPanel: FC<ServerSettingsPanelProps> = ({
  open,
  onClose,
  server,
  members,
  invites,
  currentUserRole,
  onUpdateServer,
  onAssignRole,
  onRemoveMember,
  onCreateInvite,
  onCreateCategory,
  onDeleteCategory,
}) => {
  const { tBranded: t } = useI18n();
  const [tabIndex, setTabIndex] = useState(0);
  const [editName, setEditName] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserRole === DefaultRole.OWNER;

  const handleTabChange = useCallback(
    (_: SyntheticEvent, newValue: number) => {
      setTabIndex(newValue);
      setError(null);
    },
    [],
  );

  // ─── Overview tab ───────────────────────────────────────────────────

  const handleSaveOverview = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdateServer({
        name: editName || undefined,
        iconUrl: editIconUrl || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [editName, editIconUrl, onUpdateServer]);

  // ─── Members tab ────────────────────────────────────────────────────

  const handleRoleChange = useCallback(
    async (memberId: string, e: SelectChangeEvent) => {
      try {
        await onAssignRole(memberId, e.target.value as DefaultRole);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign role');
      }
    },
    [onAssignRole],
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      try {
        await onRemoveMember(memberId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove member',
        );
      }
    },
    [onRemoveMember],
  );

  // ─── Invites tab ────────────────────────────────────────────────────

  const handleCreateInvite = useCallback(async () => {
    try {
      await onCreateInvite();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create invite',
      );
    }
  }, [onCreateInvite]);

  // ─── Categories tab ─────────────────────────────────────────────────

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    try {
      await onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create category',
      );
    }
  }, [newCategoryName, onCreateCategory]);

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      if (!onDeleteCategory) return;
      try {
        await onDeleteCategory(categoryId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete category',
        );
      }
    },
    [onDeleteCategory],
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="h6">{t(BrightChatStrings.Server_Settings_Title)}</Typography>
          {server && (
            <Typography variant="body2" color="text.secondary">
              {server.name}
            </Typography>
          )}
        </Box>

        <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
          <Tab label={t(BrightChatStrings.Server_Settings_Overview)} />
          <Tab label={t(BrightChatStrings.Server_Settings_Members)} />
          <Tab label={t(BrightChatStrings.Server_Settings_Categories)} />
          <Tab label={t(BrightChatStrings.Server_Settings_Invites)} />
        </Tabs>

        <Divider />

        {error && (
          <Typography color="error" variant="body2" sx={{ px: 2, pt: 1 }}>
            {error}
          </Typography>
        )}

        {/* Overview */}
        <TabPanel value={tabIndex} index={0}>
          <TextField
            fullWidth
            margin="dense"
            label={t(BrightChatStrings.Server_Settings_ServerNameLabel)}
            defaultValue={server?.name ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEditName(e.target.value)
            }
            disabled={saving}
          />
          <TextField
            fullWidth
            margin="dense"
            label={t(BrightChatStrings.Server_Settings_IconUrlLabel)}
            defaultValue={server?.iconUrl ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEditIconUrl(e.target.value)
            }
            disabled={saving}
          />
          <Button
            variant="contained"
            onClick={handleSaveOverview}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? t(BrightChatStrings.Server_Settings_Saving) : t(BrightChatStrings.Server_Settings_Save)}
          </Button>
        </TabPanel>

        {/* Members */}
        <TabPanel value={tabIndex} index={1}>
          <List dense>
            {members.map((member) => (
              <ListItem
                key={member.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isOwner && (
                      <Select
                        size="small"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e)}
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value={DefaultRole.OWNER}>{t(BrightChatStrings.Role_Owner)}</MenuItem>
                        <MenuItem value={DefaultRole.ADMIN}>{t(BrightChatStrings.Role_Admin)}</MenuItem>
                        <MenuItem value={DefaultRole.MODERATOR}>
                          {t(BrightChatStrings.Role_Moderator)}
                        </MenuItem>
                        <MenuItem value={DefaultRole.MEMBER}>{t(BrightChatStrings.Role_Member)}</MenuItem>
                      </Select>
                    )}
                    {isOwner && member.role !== DefaultRole.OWNER && (
                      <Tooltip title={t(BrightChatStrings.Server_Settings_RemoveMember)}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
              >
                <ListItemText
                  primary={member.displayName}
                  secondary={member.role}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Categories */}
        <TabPanel value={tabIndex} index={2}>
          <List dense>
            {(server?.categories ?? [])
              .sort(
                (a: IServerCategory, b: IServerCategory) =>
                  a.position - b.position,
              )
              .map((cat: IServerCategory) => (
                <ListItem
                  key={cat.id}
                  secondaryAction={
                    onDeleteCategory && cat.channelIds.length === 0 ? (
                      <Tooltip title={t(BrightChatStrings.Server_Settings_DeleteCategory)}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCategory(cat.id)}
                          aria-label={t(BrightChatStrings.Server_Settings_DeleteCategory)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={cat.name}
                    secondary={`${cat.channelIds.length} ${t(BrightChatStrings.Server_Settings_ChannelCount)}`}
                  />
                </ListItem>
              ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              label={t(BrightChatStrings.Server_Settings_NewCategory)}
              value={newCategoryName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewCategoryName(e.target.value)
              }
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
            >
              {t(BrightChatStrings.Server_Settings_AddCategory)}
            </Button>
          </Box>
        </TabPanel>

        {/* Invites */}
        <TabPanel value={tabIndex} index={3}>
          <Button
            variant="contained"
            onClick={handleCreateInvite}
            sx={{ mb: 2 }}
          >
            {t(BrightChatStrings.Server_Settings_GenerateInvite)}
          </Button>
          <List dense>
            {invites.map((invite) => (
              <ListItem
                key={invite.token}
                secondaryAction={
                  <Tooltip title={t(BrightChatStrings.Server_Settings_CopyToken)}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigator.clipboard?.writeText(invite.token)
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primary={invite.token.slice(0, 12) + '…'}
                  secondary={`${t(BrightChatStrings.Server_Settings_Uses)} ${invite.currentUses}${invite.maxUses ? `/${invite.maxUses}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Box>
    </Drawer>
  );
};

export default memo(ServerSettingsPanel);
