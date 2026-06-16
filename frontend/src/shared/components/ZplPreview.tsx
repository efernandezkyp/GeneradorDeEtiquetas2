interface ZplPreviewProps {
  content: string;
}

export function ZplPreview({ content }: ZplPreviewProps) {
  return <pre data-testid="zpl-preview">{content}</pre>;
}
