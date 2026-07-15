import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            background-color: #080c0a !important;
            color: #fcfcfc !important;
            height: 100%;
            margin: 0;
            padding: 0;
          }
        ` }} />
      </head>
      <body style={{ backgroundColor: '#080c0a' }}>{children}</body>
    </html>
  );
}
