export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBlobFile(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printText(title: string, content: string): void {
  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) {
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Consolas, monospace; padding: 24px; }
          pre { white-space: pre-wrap; word-break: break-word; }
        </style>
      </head>
      <body>
        <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}
