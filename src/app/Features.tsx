import {useState} from 'react';
import {addDays, addMonths, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths} from 'date-fns';
import {enUS, vi} from 'date-fns/locale';
import {ChevronLeft, ChevronRight, Clock3, Plus, Trash2} from 'lucide-react';
import type {Category, Schedule, Task} from './model';
import {toDate, uid} from './model';
import {useLanguage, useTranslate} from './i18n';
import NativeInput from './NativeInput';

export function useFormatters() {
  const language = useLanguage();
  return {
    date: (day: Date, pattern: string) => format(day, pattern, {locale: language === 'vi' ? vi : enUS}),
    money: (amount: number) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {style: 'currency', currency: 'VND', maximumFractionDigits: 0}).format(amount)
  };
}

export function CalendarCard({month, setMonth, selected, onSelect, tasks, schedules = []}: {month: Date; setMonth: (date: Date) => void; selected: Date; onSelect: (date: Date) => void; tasks: Task[]; schedules?: Schedule[]}) {
  const t = useTranslate();
  const {date} = useFormatters();
  const language = useLanguage();
  const first = startOfWeek(startOfMonth(month), {weekStartsOn: 1});
  const weekdays = language === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return <section className="card calendar-card">
    <div className="calendar-title">
      <button className="icon-button" onClick={() => setMonth(subMonths(month, 1))} aria-label={t('Tháng trước')}><ChevronLeft size={19} /></button>
      <div><strong>{date(month, 'MMMM yyyy')}</strong><small>{t('Chọn ngày để xem công việc')}</small></div>
      <button className="icon-button" onClick={() => setMonth(addMonths(month, 1))} aria-label={t('Tháng sau')}><ChevronRight size={19} /></button>
    </div>
    <div className="calendar-grid">
      {weekdays.map(day => <span className="weekday" key={day}>{day}</span>)}
      {Array.from({length: 42}, (_, index) => {
        const day = addDays(first, index);
        const active = isSameDay(day, selected);
        return <button key={index} onClick={() => onSelect(day)} title={date(day, 'dd/MM/yyyy')}
          className={'day ' + (!isSameMonth(day, month) ? 'muted ' : '') + (active ? 'selected' : '')}>
          <span>{date(day, 'd')}</span>{(tasks.some(task => task.date === toDate(day)) || schedules.some(item => item.startDate <= toDate(day) && (item.days.includes(day.getDay()) || (!item.days.length && item.startDate === toDate(day))))) && <i />}
        </button>;
      })}
    </div>
  </section>;
}

export function TaskForm({onAdd, day, categories}: {onAdd: (task: Task) => void; day: Date; categories: Category[]}) {
  const t = useTranslate();
  const {date} = useFormatters();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cá nhân');
  const [priority, setPriority] = useState<Task['priority']>('Trung bình');
  const [time, setTime] = useState('');
  const add = (input = title) => {
    if (!input.trim()) return;
    onAdd({id: uid(), title: input.trim(), category, priority, date: toDate(day), status: 'Chờ', createdAt: performance.timeOrigin + performance.now(), ...(time ? {time} : {})});
    setTitle('');
  };
  return <div className="add-task card">
    <div className="task-input"><Plus size={20} />
      <NativeInput aria-label={t('Nội dung công việc')} value={title} onChange={setTitle} onEnter={add} placeholder={t('Thêm công việc...')} />
      <button className="send" onClick={() => add()}>{t('Thêm')}</button>
    </div>
    <div className="form-controls">
      <label>{t('Phân loại')} <select value={category} onChange={event => setCategory(event.target.value)}>
        {categories.filter(item => item.type === 'Công việc').map(item => <option key={item.id} value={item.name}>{t(item.name)}</option>)}
      </select></label>
      <label>{t('Hẹn giờ')} <input type="time" value={time} onChange={event => setTime(event.target.value)} /></label>
      <label>{t('Ưu tiên')} <select value={priority} onChange={event => setPriority(event.target.value as Task['priority'])}>
        {(['Rất cao', 'Cao', 'Trung bình', 'Thấp'] as const).map(item => <option key={item} value={item}>{t(item)}</option>)}
      </select></label>
      <span className="form-date">{t('Ngày')}: {date(day, 'dd/MM/yyyy')}</span>
    </div>
  </div>;
}

export function TaskList({tasks, onStatus, onDelete}: {tasks: Task[]; onStatus: (id: string, status: Task['status']) => void; onDelete: (id: string) => void}) {
  const t = useTranslate();
  const {date} = useFormatters();
  return <div className="task-list">{tasks.map(task => <div className="task-row" key={task.id}>
    <input type="checkbox" aria-label={t('Hoàn thành') + ' ' + task.title} checked={task.status === 'Đã thực hiện'}
      onChange={event => onStatus(task.id, event.target.checked ? 'Đã thực hiện' : 'Chờ')} />
    <div className="task-main"><div className={task.status === 'Đã thực hiện' ? 'strike' : ''}>{task.title}</div>
      <small><span className={'dot ' + (task.category === 'Cá nhân' ? 'coral' : 'mint')} />{t(task.category)} · {t(task.priority)} · {date(parseISO(task.date), 'dd/MM/yyyy')}</small>
    </div>
    {task.time && <span className="task-time"><Clock3 size={14} />{task.time}</span>}
    <select className="status-select" aria-label={t('Trạng thái') + ' ' + task.title} value={task.status}
      onChange={event => onStatus(task.id, event.target.value as Task['status'])}>
      {(['Chờ', 'Đang thực hiện', 'Đã thực hiện', 'Chưa xong'] as const).map(item => <option key={item} value={item}>{t(item)}</option>)}
    </select>
    <button className="icon-button small" aria-label={t(task.id.includes('@') ? 'Xóa lịch lặp' : 'Xóa') + ' ' + task.title} onClick={() => onDelete(task.id)}><Trash2 size={15} /></button>
  </div>)}</div>;
}

export function ScheduleForm({onAdd, categories}: {onAdd: (schedule: Schedule) => void; categories: Category[]}) {
  const t = useTranslate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cá nhân');
  const [startDate, setStartDate] = useState(toDate(new Date()));
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const add = (input = title) => {
    if (!input.trim()) return;
    onAdd({id: uid(), title: input.trim(), category, priority: 'Trung bình', startDate: startDate || toDate(new Date()), days, startTime: startTime.trim(), endTime: endTime.trim(), statuses: {}, createdAt: performance.timeOrigin + performance.now()});
    setTitle('');
  };
  return <div className="add-task card schedule-form">
    <div className="task-input"><Plus size={20} /><NativeInput aria-label={t('Nội dung công việc')} value={title} onChange={setTitle} onEnter={add} placeholder={t('Công việc lặp lại...')} /><button className="send" onClick={() => add()}>{t('Thêm')}</button></div>
    <div className="form-controls"><label>{t('Bắt đầu từ ngày')} <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
      <label>{t('Từ')} <NativeInput type="text" value={startTime} onChange={setStartTime} placeholder={t('Tùy chọn')} aria-label={t('Từ')} /></label>
      <label>{t('Đến')} <NativeInput type="text" value={endTime} onChange={setEndTime} placeholder={t('Tùy chọn')} aria-label={t('Đến')} /></label>
      <label>{t('Phân loại')} <select value={category} onChange={event => setCategory(event.target.value)}>{categories.filter(item => item.type === 'Công việc').map(item => <option key={item.id} value={item.name}>{t(item.name)}</option>)}</select></label></div>
    <div className="schedule-days" aria-label={t('Ngày lặp lại')}>{dayNames.map((name, day) => <label key={day}><input type="checkbox" checked={days.includes(day)} onChange={event => setDays(current => event.target.checked ? [...current, day].sort() : current.filter(item => item !== day))} />{t(name)}</label>)}<small>{t('Bỏ chọn hết để chỉ làm vào ngày bắt đầu')}</small></div>
  </div>;
}

export function CategoryManager({categories, onAdd, onRename, onDelete, usage}: {categories: Category[]; onAdd: (type: Category['type'], name: string) => string | null; onRename: (id: string, name: string) => string | null; onDelete: (id: string) => string | null; usage: (category: Category) => number}) {
  const t = useTranslate();
  const [type, setType] = useState<Category['type']>('Công việc');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const add = (text = name) => { const error = onAdd(type, text); setMessage(t(error || 'Đã thêm danh mục')); if (!error) setName(''); };
  return <div className="category-manager">
    <div className="category-create">
      <select aria-label={t('Loại danh mục')} value={type} onChange={event => setType(event.target.value as Category['type'])}>
        {(['Công việc', 'Thu', 'Chi'] as const).map(item => <option key={item} value={item}>{t(item)}</option>)}
      </select>
      <NativeInput placeholder={t('Tên danh mục mới')} aria-label={t('Tên danh mục mới')} value={name} onChange={setName} onEnter={add} />
      <button className="send" onClick={() => add()}>{t('Thêm danh mục')}</button>
    </div>
    {message && <p className="category-message" role="status">{message}</p>}
    {(['Công việc', 'Thu', 'Chi'] as const).map(kind => <div key={kind} className="category-group">
      <h3>{t(kind === 'Công việc' ? 'Danh mục công việc' : kind === 'Thu' ? 'Danh mục khoản thu' : 'Danh mục khoản chi')}</h3>
      {categories.filter(item => item.type === kind).map(item => <div key={item.id} className="category-manage-row">
        <span>{t(item.name)}</span><small>{usage(item)} {t('mục đang dùng')}</small>
        <button className="icon-button small" title={t('Đổi tên')} aria-label={t('Đổi tên') + ' ' + item.name} onClick={() => {
          const next = prompt(t('Đổi tên danh mục'), item.name);
          if (next !== null) setMessage(t(onRename(item.id, next) || 'Đã đổi tên'));
        }}>✎</button>
        <button className="icon-button small" title={t('Xóa danh mục')} aria-label={t('Xóa danh mục') + ' ' + item.name} onClick={() => setMessage(t(onDelete(item.id) || 'Đã xóa danh mục'))}><Trash2 size={15} /></button>
      </div>)}
    </div>)}
  </div>;
}
