import {lazy, Suspense, useEffect, useMemo, useState} from 'react';
import {LayoutDashboard, CheckCircle2, CalendarDays, Wallet, Settings, Search, Plus, Sun, Moon, Clock3} from 'lucide-react';
import type {Category, Page, Schedule, Task, Transaction} from './model';
import {initialCategories, keys, readSaved, toDate, uid} from './model';
import {LanguageContext, useTranslate, type Language} from './i18n';
import NativeInput from './NativeInput';
import ExternalLink from './ExternalLink';
import {SecurityGate, SecuritySettings} from './Security';
import {CalendarCard, CategoryManager, ScheduleForm, TaskForm, TaskList, useFormatters} from './Features';

const Finance = lazy(() => import('./Finance'));

function taskMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.match(/(?:^|\D)(\d{1,2})(?:(?::|h)(\d{0,2}))?(?!\d)/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function sortTaskList(items: Task[], legacyOrder: Map<string, number>): Task[] {
  const order = (task: Task) => task.createdAt ?? legacyOrder.get(task.id) ?? 0;
  return items.sort((a, b) => {
    const aMinutes = taskMinutes(a.time);
    const bMinutes = taskMinutes(b.time);
    const aGroup = !a.time ? 2 : aMinutes === null ? 1 : 0;
    const bGroup = !b.time ? 2 : bMinutes === null ? 1 : 0;
    if (aGroup !== bGroup) return aGroup - bGroup;
    if (aGroup === 0) return a.date.localeCompare(b.date) || aMinutes! - bMinutes! || order(a) - order(b);
    return order(a) - order(b);
  });
}

const navigation = [
  {label: 'Dashboard', icon: LayoutDashboard},
  {label: 'Công việc', icon: CheckCircle2},
  {label: 'Thời khóa biểu', icon: Clock3},
  {label: 'Lịch', icon: CalendarDays},
  {label: 'Thu chi', icon: Wallet},
  {label: 'Cài đặt', icon: Settings}
] as const;

function AppContent({language, switchLanguage, setLanguage, security}: {
  language: Language;
  switchLanguage: () => void;
  setLanguage: (value: Language) => void;
  security: {hasPassword: boolean; setHasPassword: (value: boolean) => void; lock: () => void};
}) {
  const t = useTranslate();
  const {date, money} = useFormatters();
  const [page, setPage] = useState<Page>('Dashboard');
  const [dark, setDark] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => readSaved<Task>(keys.tasks));
  const [schedules, setSchedules] = useState<Schedule[]>(() => readSaved<Schedule>(keys.schedules));
  const [transactions, setTransactions] = useState<Transaction[]>(() => readSaved<Transaction>(keys.money));
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = readSaved<Category>(keys.categories);
    return saved.length ? saved : initialCategories;
  });
  const [query, setQuery] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { localStorage.setItem(keys.tasks, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(keys.schedules, JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem(keys.money, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(keys.categories, JSON.stringify(categories)); }, [categories]);

  const usage = (category: Category) => category.type === 'Công việc'
    ? tasks.filter(task => task.category === category.name).length + schedules.filter(item => item.category === category.name).length
    : transactions.filter(item => item.kind === category.type && item.category === category.name).length;

  const addCategory = (type: Category['type'], name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Vui lòng nhập tên danh mục';
    if (categories.some(item => item.type === type && item.name.toLocaleLowerCase('vi') === trimmed.toLocaleLowerCase('vi'))) return 'Danh mục đã tồn tại';
    setCategories(current => [...current, {id: uid(), type, name: trimmed}]);
    return null;
  };
  const renameCategory = (id: string, name: string) => {
    const category = categories.find(item => item.id === id);
    if (!category) return 'Không tìm thấy danh mục';
    const trimmed = name.trim();
    if (!trimmed) return 'Tên không được để trống';
    if (categories.some(item => item.id !== id && item.type === category.type && item.name.toLocaleLowerCase('vi') === trimmed.toLocaleLowerCase('vi'))) return 'Danh mục đã tồn tại';
    setCategories(current => current.map(item => item.id === id ? {...item, name: trimmed} : item));
    if (category.type === 'Công việc') {
      setTasks(current => current.map(item => item.category === category.name ? {...item, category: trimmed} : item));
      setSchedules(current => current.map(item => item.category === category.name ? {...item, category: trimmed} : item));
    }
    else setTransactions(current => current.map(item => item.kind === category.type && item.category === category.name ? {...item, category: trimmed} : item));
    return null;
  };
  const deleteCategory = (id: string) => {
    const category = categories.find(item => item.id === id);
    if (!category) return 'Không tìm thấy danh mục';
    if (usage(category) > 0) return 'Danh mục đang có dữ liệu, hãy chuyển dữ liệu sang danh mục khác trước khi xóa';
    if (categories.filter(item => item.type === category.type).length <= 1) return 'Cần giữ ít nhất một danh mục cho mỗi loại';
    setCategories(current => current.filter(item => item.id !== id));
    return null;
  };

  const scheduleTime = (item: Schedule) => item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : item.startTime ? `${t('Từ')} ${item.startTime}` : item.endTime ? `${t('Đến')} ${item.endTime}` : '';
  const scheduledFor = (day: Date) => schedules.filter(item => item.startDate <= toDate(day) && (item.days.includes(day.getDay()) || (!item.days.length && item.startDate === toDate(day)))).map(item => ({id: `${item.id}@${toDate(day)}`, title: item.title, category: item.category, priority: item.priority, date: toDate(day), time: scheduleTime(item), status: item.statuses[toDate(day)] || 'Chờ', createdAt: item.createdAt} as Task));
  const shown = useMemo(() => {
    const scheduled = scheduledFor(selected);
    const order = new Map([...tasks.slice().reverse(), ...scheduled].map((task, index) => [task.id, index]));
    return sortTaskList([...tasks.filter(task => task.date === toDate(selected)), ...scheduled].filter(task => task.title.toLowerCase().includes(query.toLowerCase())), order);
  }, [tasks, schedules, selected, query]);
  const all = useMemo(() => {
    const scheduled = scheduledFor(selected);
    const order = new Map([...tasks.slice().reverse(), ...scheduled].map((task, index) => [task.id, index]));
    return sortTaskList([...tasks, ...scheduled].filter(task => task.title.toLowerCase().includes(query.toLowerCase())), order);
  }, [tasks, schedules, selected, query]);
  const updateStatus = (id: string, status: Task['status']) => {
    if (id.includes('@')) { const [scheduleId, day] = id.split('@'); setSchedules(current => current.map(item => item.id === scheduleId ? {...item, statuses: {...item.statuses, [day]: status}} : item)); }
    else setTasks(current => current.map(task => task.id === id ? {...task, status} : task));
  };
  const deleteTask = (id: string) => {
    if (id.includes('@')) {
      if (window.confirm(t('Xóa lịch lặp này cho mọi ngày?'))) setSchedules(current => current.filter(item => item.id !== id.split('@')[0]));
    }
    else setTasks(current => current.filter(task => task.id !== id));
  };
  const calendar = <CalendarCard month={month} setMonth={setMonth} selected={selected} onSelect={day => { setSelected(day); setMonth(day); }} tasks={tasks} schedules={schedules} />;
  const form = <TaskForm day={selected} categories={categories} onAdd={task => setTasks(current => [task, ...current])} />;
  const taskList = (items: Task[]) => <TaskList tasks={items} onStatus={updateStatus} onDelete={deleteTask} />;
  const dayLabel = date(selected, 'dd/MM/yyyy');
  const nextTask = shown.find(task => task.status !== 'Đã thực hiện');
  const exportData = () => {
    const data = {format: 'Workly', version: 1, exportedAt: new Date().toISOString(), data: {tasks, schedules, transactions, categories, language}};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = `Workly ${toDate(new Date())}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const data = backup?.data;
      if (backup.format !== 'Workly' || backup.version !== 1 || !data || !Array.isArray(data.tasks) || !Array.isArray(data.schedules) || !Array.isArray(data.transactions) || !Array.isArray(data.categories) ||
        !data.tasks.every((item: Task) => typeof item.id === 'string' && typeof item.title === 'string' && typeof item.category === 'string' && typeof item.priority === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && ['Chờ', 'Đang thực hiện', 'Đã thực hiện', 'Chưa xong'].includes(item.status) && (item.time === undefined || /^\d{2}:\d{2}$/.test(item.time)) && (item.createdAt === undefined || Number.isFinite(item.createdAt))) ||
        !data.schedules.every((item: Schedule) => typeof item.id === 'string' && typeof item.title === 'string' && typeof item.category === 'string' && typeof item.priority === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate) && Array.isArray(item.days) && item.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && typeof item.startTime === 'string' && typeof item.endTime === 'string' && item.statuses && typeof item.statuses === 'object' && !Array.isArray(item.statuses) && Object.values(item.statuses).every(status => ['Chờ', 'Đang thực hiện', 'Đã thực hiện', 'Chưa xong'].includes(status as string)) && (item.createdAt === undefined || Number.isFinite(item.createdAt))) ||
        !data.transactions.every((item: Transaction) => typeof item.id === 'string' && typeof item.title === 'string' && Number.isFinite(item.amount) && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && ['Thu', 'Chi'].includes(item.kind) && typeof item.category === 'string') ||
        !data.categories.every((item: Category) => typeof item.id === 'string' && typeof item.name === 'string' && ['Công việc', 'Thu', 'Chi'].includes(item.type))) throw new Error('invalid backup');
      if (!window.confirm(t('Nhập dữ liệu sẽ thay thế dữ liệu hiện tại. Tiếp tục?'))) return;
      setTasks(data.tasks); setSchedules(data.schedules); setTransactions(data.transactions); setCategories(data.categories);
      if (data.language === 'vi' || data.language === 'en') setLanguage(data.language);
      setInfo(t('Đã nhập dữ liệu thành công'));
    } catch { setInfo(t('Tệp sao lưu không hợp lệ hoặc không đọc được')); }
  };

  return <div className={'app ' + (dark ? 'dark' : '')}><div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✣</span> Workly</div>
      <div className="side-card">{navigation.map(item => <button key={item.label} className={'nav ' + (page === item.label ? 'active' : '')} onClick={() => setPage(item.label)}>
        <item.icon size={19} />{t(item.label)}
      </button>)}</div>
      <div className="side-label">{t('Danh mục')} <button className="sidebar-add" title={t('Quản lý danh mục')} onClick={() => setPage('Danh mục')}><Plus size={17} /></button></div>
      <div className="side-card categories">
        {categories.filter(item => item.type === 'Công việc').map(item => <button className="category category-link" key={item.id} onClick={() => setPage('Công việc')}>{t(item.name)}</button>)}
        <button className="category category-link" onClick={() => setPage('Danh mục')}>{t('Quản lý danh mục')} →</button>
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-bottom"><span className="avatar">PW</span><div><strong>Personal Workspace</strong><small>{t('Offline · Windows')}</small></div></div>
        <ExternalLink className="sidebar-site" />
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="search"><Search size={20} /><NativeInput aria-label={t('Tìm công việc...')} placeholder={t('Tìm công việc...')} value={query} onChange={setQuery} live /></div>
        <div className="top-actions"><span className="date-label">{date(now, 'EEEE, dd/MM/yyyy')} · {date(now, 'HH:mm')}</span>
          <button className="language-button" aria-label={t('Chuyển ngôn ngữ')} title={t('Chuyển ngôn ngữ')} onClick={switchLanguage}>{language === 'vi' ? 'VI' : 'EN'}</button>
          <button className="icon-button" aria-label={t('Đổi giao diện')} onClick={() => setDark(!dark)}>{dark ? <Sun size={20} /> : <Moon size={20} />}</button>
          <span className="avatar">PW</span>
        </div>
      </header>
      {page === 'Dashboard' ? <div className="dashboard-grid">
        <section className="hero card"><div className="hero-copy"><h1>{t(now.getHours() < 11 ? 'Chào buổi sáng!' : now.getHours() < 18 ? 'Chào buổi chiều!' : 'Chào buổi tối!')}</h1>
          <p>{language === 'vi' ? `Bạn có ${shown.filter(task => task.status !== 'Đã thực hiện').length} công việc ngày ${dayLabel}` : `You have ${shown.filter(task => task.status !== 'Đã thực hiện').length} tasks on ${dayLabel}`}</p></div>
          <div className="landscape"><div className="sun-circle" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="tree tree-one" /><div className="tree tree-two" /></div>
          <div className="up-next"><strong>{t('Công việc tiếp theo')}</strong><p>{nextTask?.title || t('Chưa có công việc')}</p><small>{dayLabel}</small>{nextTask?.time && <span className="up-next-time"><Clock3 size={14} />{nextTask.time}</span>}</div>
        </section>
        {calendar}
        <section className="task-panel">{form}<div className="section-heading"><h2>{t('Danh sách công việc')}</h2><span>{dayLabel} · {shown.length} {language === 'vi' ? 'việc' : 'tasks'}</span></div><div className="card task-card">{taskList(shown)}</div></section>
        <section className="focus card"><div className="focus-content"><h2>{t('Tổng quan')}</h2><p>{language === 'vi' ? `Công việc ngày ${dayLabel}` : `Tasks on ${dayLabel}`}</p>
          <div className="timer-controls"><strong>{shown.filter(task => task.status === 'Đã thực hiện').length}/{shown.length}</strong></div><p style={{textAlign: 'center'}}>{t('Đã hoàn thành')}</p></div>
          <div className="forest"><div className="mountain m1" /><div className="mountain m2" /><div className="forest-line">♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠</div></div>
        </section>
        <section className="finance card"><div className="section-heading"><h2>{t('Tổng quan tài chính')}</h2><button className="send" onClick={() => setPage('Thu chi')}>{t('Xem thu chi')}</button></div>
          <div className="finance-layout"><div className="finance-stats">
            <div className="stat"><span>{t('Tổng thu')}</span><strong className="green">{money(transactions.filter(item => item.kind === 'Thu').reduce((sum, item) => sum + item.amount, 0))}</strong></div>
            <div className="stat"><span>{t('Tổng chi')}</span><strong className="orange">{money(transactions.filter(item => item.kind === 'Chi').reduce((sum, item) => sum + item.amount, 0))}</strong></div>
            <div className="stat"><span>{t('Số dư dòng tiền')}</span><strong>{money(transactions.reduce((sum, item) => sum + (item.kind === 'Thu' ? item.amount : -item.amount), 0))}</strong></div>
          </div></div>
        </section>
      </div> : page === 'Công việc' ? <section className="page-card card"><div className="page-title"><h1>{t('Danh sách công việc')}</h1><p>{t('Thêm công việc, chọn phân loại, ưu tiên và cập nhật trạng thái')}</p></div>{form}<div className="task-card">{taskList(all)}</div></section>
      : page === 'Thời khóa biểu' ? <section className="page-card card"><div className="page-title"><h1>{t('Thời khóa biểu')}</h1><p>{t('Tạo công việc theo ngày bạn chọn. Giờ bắt đầu và kết thúc có thể để trống.')}</p></div>
        <ScheduleForm categories={categories} onAdd={item => setSchedules(current => [...current, item])} />
        <div className="section-heading"><h2>{t('Lịch lặp lại')}</h2></div>
        {schedules.map(item => <div className="schedule-row" key={item.id}><div><strong>{item.title}</strong><small>{[scheduleTime(item), item.days.length === 7 ? t('Hàng ngày') : item.days.length ? item.days.map(day => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day]).join(', ') : t('Một lần'), `${t('Từ')} ${item.startDate}`].filter(Boolean).join(' · ')}</small></div><button className="icon-button small" aria-label={t('Xóa') + ' ' + item.title} onClick={() => setSchedules(current => current.filter(schedule => schedule.id !== item.id))}>×</button></div>)}
      </section>
      : page === 'Lịch' ? <section className="page-card card"><div className="page-title"><h1>{t('Lịch công việc')}</h1><p>{t('Chọn một ngày để xem các công việc đã lưu')}</p></div>{calendar}<div className="section-heading"><h2>{t('Ngày')} {dayLabel}</h2></div>{taskList(shown)}</section>
      : page === 'Danh mục' ? <section className="page-card card"><div className="page-title"><h1>{t('Quản lý danh mục')}</h1><p>{t('Danh mục dùng chung cho công việc, khoản thu và khoản chi. Thay đổi được đồng bộ với dữ liệu đã lưu.')}</p></div>
        <CategoryManager categories={categories} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} usage={usage} /></section>
      : page === 'Thu chi' ? <Suspense fallback={<section className="page-card card">{t('Đang tải...')}</section>}><Finance categories={categories} items={transactions} onAdd={item => setTransactions(current => [item, ...current])} onDelete={id => setTransactions(current => current.filter(item => item.id !== id))} /></Suspense>
      : <section className="page-card card"><h1>{t('Cài đặt')}</h1><p>{t('Ứng dụng offline, dữ liệu hiện lưu trên thiết bị.')}</p>
        {info && <p role="status">{info}</p>}
        <section className="backup-settings"><h2>{t('Sao lưu dữ liệu')}</h2><p>{t('Xuất hoặc nhập công việc, thời khóa biểu, thu chi và danh mục. Tệp JSON có định dạng Workly phiên bản 1.')}</p>
          <button className="send" onClick={exportData}>{t('Xuất dữ liệu')}</button>
          <label className="backup-import">{t('Nhập dữ liệu')} <input type="file" accept=".json,application/json" onChange={event => { void importData(event.target.files?.[0]); event.target.value = ''; }} /></label>
        </section>
        <SecuritySettings {...security} />
      </section>}
      <footer className="footer">{t('Personal Workspace v1.5 · Offline · Lưu dữ liệu trên thiết bị')}
        <ExternalLink className="mobile-site" />
      </footer>
    </main>
  </div></div>;
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem(keys.language) === 'en' ? 'en' : 'vi');
  const switchLanguage = () => setLanguage(current => current === 'vi' ? 'en' : 'vi');
  useEffect(() => { localStorage.setItem(keys.language, language); document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={language}>
    <SecurityGate>{security => <AppContent language={language} switchLanguage={switchLanguage} setLanguage={setLanguage} security={security} />}</SecurityGate>
  </LanguageContext.Provider>;
}
