# Database design (Stage 2–3, chưa triển khai)

`tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,note TEXT,priority TEXT,scheduled_at TEXT,status TEXT,completed_at TEXT,created_at TEXT,updated_at TEXT)`
`task_history(id TEXT PRIMARY KEY,task_id TEXT NOT NULL,old_status TEXT,new_status TEXT,old_scheduled_at TEXT,new_scheduled_at TEXT,changed_at TEXT)`
`categories(id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,color TEXT)`
`transactions(id TEXT PRIMARY KEY,category_id TEXT,description TEXT,amount_vnd INTEGER NOT NULL,occurred_at TEXT,note TEXT)`
`budgets(id TEXT PRIMARY KEY,category_id TEXT,month TEXT,limit_vnd INTEGER NOT NULL)`
`settings(key TEXT PRIMARY KEY,value TEXT)`

Quy tắc chuyển lịch: chỉ task chưa hoàn thành có scheduled_at trước ngày hiện tại mới được dời; ghi history cùng transaction; không dời lặp nếu chạy lại. Định nghĩa chi tiết trong Stage 2.
