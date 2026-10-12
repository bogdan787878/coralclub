# Заявки с /landing → Google Таблица

1. Создайте Google Таблицу → Расширения → Apps Script, вставьте `apps-script.gs`.
2. Deploy → New deployment → Web app: Execute as **Me**, Who has access **Anyone**.
3. Скопируйте URL вида `https://script.google.com/macros/s/.../exec`.
4. Добавьте его в GitHub → Settings → Secrets and variables → Actions → **Variables**
   как `NEXT_PUBLIC_LEADS_ENDPOINT` (workflow подставляет её при сборке).
5. Пересоберите (push в main или Run workflow).

Пока переменная не задана, форма работает, но заявка остаётся только в
localStorage браузера (`coralclub.leads.pending`) — в таблицу не попадёт.
