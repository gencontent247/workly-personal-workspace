import {useState} from 'react';
import {format, parseISO} from 'date-fns';
import {BarChart, Bar, ResponsiveContainer, XAxis, Tooltip} from 'recharts';
import {Trash2} from 'lucide-react';
import type {Category, Transaction} from './model';
import {toDate, uid} from './model';
import {useTranslate} from './i18n';
import NativeInput from './NativeInput';
import {useFormatters} from './Features';

function MoneyPanel({kind, items, onAdd, onDelete, categories}: {kind: 'Thu' | 'Chi'; items: Transaction[]; onAdd: (item: Transaction) => void; onDelete: (id: string) => void; categories: Category[]}) {
  const t = useTranslate();
  const {date, money} = useFormatters();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(toDate(new Date()));
  const [category, setCategory] = useState(kind === 'Thu' ? 'Lương' : 'Ăn uống');
  const options = categories.filter(item => item.type === kind).map(item => item.name);
  const submit = () => {
    const number = Number(amount);
    if (!title.trim() || !Number.isSafeInteger(number) || number <= 0) return;
    onAdd({id: uid(), title: title.trim(), amount: number, date: day, kind, category: options.includes(category) ? category : (options[0] || 'Khác')});
    setTitle(''); setAmount('');
  };
  return <section className="card money-panel">
    <h2>{t(kind === 'Chi' ? 'Khoản chi' : 'Khoản thu')}</h2>
    <div className="money-fields">
      <NativeInput placeholder={t(kind === 'Chi' ? 'Nội dung chi' : 'Nội dung thu')} aria-label={t(kind === 'Chi' ? 'Nội dung chi' : 'Nội dung thu')} value={title} onChange={setTitle} />
      <input placeholder={t('Số tiền (VND)')} aria-label={t('Số tiền (VND)')} type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} />
      <select value={options.includes(category) ? category : (options[0] || '')} onChange={event => setCategory(event.target.value)}>
        {options.map(item => <option key={item} value={item}>{t(item)}</option>)}
      </select>
      <input aria-label={t('Ngày') + ' ' + t(kind)} type="date" value={day} onChange={event => setDay(event.target.value)} />
      <button className="send" onClick={submit}>+ {t(kind === 'Chi' ? 'Thêm chi' : 'Thêm thu')}</button>
    </div>
    <div className="money-list">{items.length === 0 ? <p className="no-records">{t(kind === 'Chi' ? 'Chưa có khoản chi trong tháng này' : 'Chưa có khoản thu trong tháng này')}</p> :
      items.map(item => <div className="money-row" key={item.id}>
        <div><strong>{item.title}</strong><small>{t(item.category)} · {date(parseISO(item.date), 'dd/MM/yyyy')}</small></div>
        <b className={kind === 'Thu' ? 'green' : 'orange'}>{kind === 'Thu' ? '+' : '−'}{money(item.amount)}</b>
        <button className="icon-button small" aria-label={t('Xóa giao dịch')} onClick={() => onDelete(item.id)}><Trash2 size={14} /></button>
      </div>)}</div>
  </section>;
}

export default function Finance({items, onAdd, onDelete, categories}: {items: Transaction[]; onAdd: (item: Transaction) => void; onDelete: (id: string) => void; categories: Category[]}) {
  const t = useTranslate();
  const {money} = useFormatters();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const filtered = items.filter(item => item.date.startsWith(month));
  const total = (kind: 'Thu' | 'Chi') => filtered.filter(item => item.kind === kind).reduce((sum, item) => sum + item.amount, 0);
  const bars = Array.from({length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() || 1}, (_, index) => {
    const day = `${month}-${String(index + 1).padStart(2, '0')}`;
    return {day: index + 1, Thu: filtered.filter(item => item.kind === 'Thu' && item.date === day).reduce((sum, item) => sum + item.amount, 0), Chi: filtered.filter(item => item.kind === 'Chi' && item.date === day).reduce((sum, item) => sum + item.amount, 0)};
  });
  return <div className="finance-page">
    <div className="finance-heading"><div><h1>{t('Báo cáo tài chính')}</h1><p>{t('Quản lý thu nhập, chi tiêu và ngân sách cá nhân')}</p></div>
      <label>{t('Tháng')} <input type="month" value={month} onChange={event => setMonth(event.target.value)} /></label></div>
    <div className="money-summary">
      <div className="card"><small>{t('Tổng thu')}</small><strong className="green">{money(total('Thu'))}</strong></div>
      <div className="card"><small>{t('Tổng chi')}</small><strong className="orange">{money(total('Chi'))}</strong></div>
      <div className="card"><small>{t('Chênh lệch')}</small><strong>{money(total('Thu') - total('Chi'))}</strong></div>
    </div>
    <div className="finance-two">
      <MoneyPanel kind="Chi" categories={categories} items={filtered.filter(item => item.kind === 'Chi')} onAdd={onAdd} onDelete={onDelete} />
      <MoneyPanel kind="Thu" categories={categories} items={filtered.filter(item => item.kind === 'Thu')} onAdd={onAdd} onDelete={onDelete} />
    </div>
    <div className="card chart-panel"><h2>{t('Biểu đồ dòng tiền theo ngày')}</h2>
      <ResponsiveContainer width="100%" height={240}><BarChart data={bars}><XAxis dataKey="day" fontSize={10} /><Tooltip formatter={value => money(Number(value))} />
        <Bar name={t('Thu')} dataKey="Thu" fill="#60bda9" radius={[3, 3, 0, 0]} /><Bar name={t('Chi')} dataKey="Chi" fill="#edaa83" radius={[3, 3, 0, 0]} />
      </BarChart></ResponsiveContainer>
    </div>
  </div>;
}

