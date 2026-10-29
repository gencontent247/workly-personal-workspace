import {Capacitor} from '@capacitor/core';
import {Browser} from '@capacitor/browser';
import type {MouseEvent} from 'react';

const url = 'https://gencontent.top';

export default function ExternalLink({className}: {className: string}) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!Capacitor.isNativePlatform()) return;
    event.preventDefault();
    void Browser.open({url});
  };
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer" onClick={open}>{url}</a>;
}
