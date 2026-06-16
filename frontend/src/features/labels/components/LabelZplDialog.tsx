import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { downloadTextFile, printText } from '../../../shared/utils/fileActions';
import { ZplPreview } from '../../../shared/components/ZplPreview';

interface LabelZplDialogProps {
  open: boolean;
  labelId: string | null;
  zpl: string;
  onClose: () => void;
  onDownload?: () => Promise<void> | void;
}

export function LabelZplDialog({ open, labelId, zpl, onClose, onDownload }: LabelZplDialogProps) {
  const fileName = `label-${labelId ?? 'preview'}.zpl`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Vista ZPL</DialogTitle>
      <DialogContent>
        <ZplPreview content={zpl} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          onClick={async () => {
            if (onDownload) {
              await onDownload();
              return;
            }

            downloadTextFile(fileName, zpl);
          }}
        >
          Descargar
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            printText(fileName, zpl);
          }}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
