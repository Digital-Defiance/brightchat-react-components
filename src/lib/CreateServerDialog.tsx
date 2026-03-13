/**
 * CreateServerDialog — MUI Dialog for creating a new Server.
 *
 * Validates server name (1-100 chars), optional icon URL, calls
 * chatApi.createServer() on submit. Displays API errors inline
 * without closing the dialog.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import type { IServer } from '@brightchain/brightchain-lib';
import { BrightChatStrings } from '@brightchain/brightchat-lib';
import { useI18n } from '@digitaldefiance/express-suite-react-components';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  ChangeEvent,
  FC,
  FormEvent,
  memo,
  useCallback,
  useState,
} from 'react';

// ─── Validation helper (exported for property-based testing) ────────────────

/**
 * Validates a server name. Returns null if valid, or an error message string.
 *
 * Valid: 1-100 characters (inclusive).
 * Invalid: empty string or length > 100.
 */
export function validateServerName(name: string): string | null {
  if (name.length === 0) {
    return 'Server name is required';
  }
  if (name.length > 100) {
    return 'Server name must be 100 characters or fewer';
  }
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (server: IServer) => void;
  /** API call to create a server. Injected for testability. */
  createServer: (params: {
    name: string;
    iconUrl?: string;
  }) => Promise<IServer>;
}

const CreateServerDialog: FC<CreateServerDialogProps> = ({
  open,
  onClose,
  onCreated,
  createServer,
}) => {
  const { tBranded: t } = useI18n();
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      setError(null);
    },
    [],
  );

  const handleIconUrlChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIconUrl(e.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const validationError = validateServerName(name);
      if (validationError) {
        // Map English validation errors to i18n strings
        if (name.length === 0) {
          setError(t(BrightChatStrings.Create_Server_NameRequired));
        } else {
          setError(t(BrightChatStrings.Create_Server_NameTooLong));
        }
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const server = await createServer({
          name: name.trim(),
          iconUrl: iconUrl.trim() || undefined,
        });
        setName('');
        setIconUrl('');
        onCreated(server);
        onClose();
      } catch (err) {
        // Display API error without closing dialog (Requirement 5.4)
        setError(
          err instanceof Error
            ? err.message
            : t(BrightChatStrings.Create_Server_Failed),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, iconUrl, createServer, onCreated, onClose, t],
  );

  const handleClose = useCallback(() => {
    if (!submitting) {
      setName('');
      setIconUrl('');
      setError(null);
      onClose();
    }
  }, [submitting, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="create-server-dialog-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle id="create-server-dialog-title">
          {t(BrightChatStrings.Create_Server_Title)}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            fullWidth
            margin="dense"
            label={t(BrightChatStrings.Create_Server_NameLabel)}
            value={name}
            onChange={handleNameChange}
            inputProps={{ maxLength: 100 }}
            error={error !== null && error.includes('name')}
            helperText={
              error && error.includes('name') ? error : undefined
            }
            disabled={submitting}
          />
          <TextField
            fullWidth
            margin="dense"
            label={t(BrightChatStrings.Create_Server_IconLabelOptional)}
            value={iconUrl}
            onChange={handleIconUrlChange}
            disabled={submitting}
          />
          {error && !error.includes('name') && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            {t(BrightChatStrings.Create_Server_Cancel)}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
          >
            {submitting
              ? t(BrightChatStrings.Create_Server_Creating)
              : t(BrightChatStrings.Create_Server_Submit)}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default memo(CreateServerDialog);
