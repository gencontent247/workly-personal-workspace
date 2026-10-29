import {useEffect, useState} from 'react';
import {useTranslate} from './i18n';
import {securityBridge} from './securityBridge';

export function SecurityGate({children}: {children: (security: {hasPassword: boolean; setHasPassword: (value: boolean) => void; lock: () => void}) => React.ReactNode}) {
  const t = useTranslate();
  const [state, setState] = useState<'loading' | 'open' | 'locked' | 'error'>('loading');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resetting, setResetting] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    securityBridge.hasPassword().then(has => {
      setHasPassword(has);
      setState(has ? 'locked' : 'open');
    }).catch(() => setState('error'));
  }, []);

  const unlock = async () => {
    try {
      if (await securityBridge.verifyPassword(password)) {
        setPassword(''); setMessage(''); setState('open');
      } else setMessage(t('Sai mật khẩu'));
    } catch { setMessage(t('Không thể tải trạng thái mật khẩu')); }
  };

  const reset = async () => {
    if (confirmation !== 'RESET') return;
    try {
      await securityBridge.resetAll();
      localStorage.clear();
      window.location.reload();
    } catch { setMessage(t('Không thể reset dữ liệu')); }
  };

  if (state === 'open') return <>{children({hasPassword, setHasPassword, lock: () => setState('locked')})}</>;
  return <div className="app auth-screen"><section className="card auth-card">
    <h1>Personal Workspace</h1>
    {state === 'loading' ? <p>…</p> : <>
      {state === 'error' ? <p role="alert">{t('Không thể tải trạng thái mật khẩu')}</p> : <>
        <p>{t('Nhập mật khẩu để mở ứng dụng')}</p>
        <form onSubmit={event => { event.preventDefault(); void unlock(); }}>
          <input type="password" autoFocus value={password} onChange={event => setPassword(event.target.value)} aria-label={t('Mật khẩu hiện tại')} />
          <button className="send" type="submit">{t('Mở khóa')}</button>
        </form>
      </>}
      {message && <p role="alert" className="security-message">{message}</p>}
      <button className="text-button" onClick={() => setResetting(!resetting)}>{t('Quên mật khẩu?')}</button>
      {resetting && <div className="reset-panel">
        <p className="security-warning">{t('Cảnh báo: Nếu quên mật khẩu, cách duy nhất để vào lại ứng dụng là reset và xóa toàn bộ công việc, thu chi, danh mục và dữ liệu ứng dụng. Không thể khôi phục nếu không có bản sao lưu.')}</p>
        <p>{t('Để xác nhận xóa toàn bộ dữ liệu, nhập RESET rồi bấm Reset.')}</p>
        <input value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-label="RESET" />
        <button className="danger-button" disabled={confirmation !== 'RESET'} onClick={() => void reset()}>{t('Reset toàn bộ dữ liệu')}</button>
        <button className="text-button" onClick={() => setResetting(false)}>{t('Hủy')}</button>
      </div>}
    </>}
  </section></div>;
}

export function SecuritySettings({hasPassword, setHasPassword, lock}: {hasPassword: boolean; setHasPassword: (value: boolean) => void; lock: () => void}) {
  const t = useTranslate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (password.length < 8) { setMessage(t('Mật khẩu tối thiểu 8 ký tự')); return; }
    if (password !== confirm) { setMessage(t('Mật khẩu xác nhận không khớp')); return; }
    setBusy(true);
    try {
      const ok = await securityBridge.setPassword(password, hasPassword ? current : undefined);
      if (!ok) { setMessage(t('Sai mật khẩu hiện tại')); return; }
      setHasPassword(true); setCurrent(''); setPassword(''); setConfirm(''); setMessage(t('Đã cập nhật mật khẩu'));
    } catch { setMessage(t('Không thể lưu mật khẩu')); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const ok = await securityBridge.removePassword(current);
      if (!ok) { setMessage(t('Sai mật khẩu hiện tại')); return; }
      setHasPassword(false); setCurrent(''); setPassword(''); setConfirm(''); setMessage(t('Đã gỡ mật khẩu'));
    } catch { setMessage(t('Không thể lưu mật khẩu')); }
    finally { setBusy(false); }
  };

  return <section className="security-settings">
    <h2>{t('Bảo vệ ứng dụng')}</h2>
    <p className="security-warning">{t('Cảnh báo: Nếu quên mật khẩu, cách duy nhất để vào lại ứng dụng là reset và xóa toàn bộ công việc, thu chi, danh mục và dữ liệu ứng dụng. Không thể khôi phục nếu không có bản sao lưu.')}</p>
      {!hasPassword && <p>{t('Chưa cài đặt mật khẩu')}</p>}
      <div className="security-fields">
        {hasPassword && <input type="password" value={current} onChange={event => setCurrent(event.target.value)} placeholder={t('Mật khẩu hiện tại')} aria-label={t('Mật khẩu hiện tại')} />}
        <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('Mật khẩu mới')} aria-label={t('Mật khẩu mới')} />
        <input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} placeholder={t('Xác nhận mật khẩu')} aria-label={t('Xác nhận mật khẩu')} />
      </div>
      <div className="security-actions">
        <button className="send" disabled={busy} onClick={() => void save()}>{t(hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu')}</button>
        {hasPassword && <><button disabled={busy} onClick={() => void remove()}>{t('Gỡ mật khẩu')}</button><button disabled={busy} onClick={lock}>{t('Khóa ngay')}</button></>}
      </div>
      {message && <p role="status" className="security-message">{message}</p>}
  </section>;
}
