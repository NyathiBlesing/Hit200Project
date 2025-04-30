import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function FlagIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M6 2v20M6 2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </SvgIcon>
  );
}
