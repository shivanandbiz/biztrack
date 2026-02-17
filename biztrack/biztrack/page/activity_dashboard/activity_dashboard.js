// activity_dashboard.js

frappe.pages['activity-dashboard'].on_page_load = function (wrapper) {
    new ActivityDashboard(wrapper);
};

class ActivityDashboard {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'Activity Dashboard',
            single_column: true
        });

        this.setup_ui();
        this.bind_events();
        this.load_initial_data();
    }

    setup_ui() {
        // Render the HTML template into the page body
        $(frappe.render_template('activity_dashboard', this)).appendTo(this.page.main);

        this.today = frappe.datetime.get_today();
        $('#date-filter').val(this.today);
    }

    bind_events() {
        const me = this;

        $('#refresh-btn').on('click', () => this.refresh_data());
        $('#today-btn').on('click', () => {
            $('#date-filter').val(this.today);
            this.refresh_data();
        });

        $('#employee-filter, #date-filter').on('change', () => this.refresh_data());
    }

    async load_initial_data() {
        // Load employees for filter
        const employees = await frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_employees'
        });

        if (employees.message) {
            const select = $('#employee-filter');
            employees.message.forEach(emp => {
                select.append(`<option value="${emp.employee}">${emp.employee_name || emp.employee}</option>`);
            });
        }

        this.refresh_data();
    }

    async refresh_data() {
        const date = $('#date-filter').val();
        const employee = $('#employee-filter').val();

        frappe.show_progress('Loading Dashboard', 30, 100, 'Please wait');

        try {
            // Fetch Activity Summary
            const summary = await frappe.call({
                method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_activity_summary',
                args: { date, employee }
            });

            // Fetch Hourly Activity
            const hourly = await frappe.call({
                method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_hourly_activity',
                args: { date, employee }
            });

            this.render_dashboard(summary.message, hourly.message);
            frappe.hide_progress();

        } catch (err) {
            console.error(err);
            frappe.hide_progress();
            frappe.msgprint('Error loading dashboard data');
        }
    }

    render_dashboard(summary, hourly) {
        if (!summary) return;

        this.render_summary_cards(summary);
        this.render_hourly_chart(hourly);
        this.render_top_apps(summary.top_applications);
        this.render_categories(summary.top_categories);
        this.render_window_titles(summary.window_titles);
        this.render_employee_app_usage(summary.employee_app_usage);
        // this.render_employee_activity(summary.employee_activity); // Optional, can keep if needed
    }

    render_summary_cards(data) {
        let total_seconds = 0;
        let total_sessions = 0;
        let unique_apps = new Set();

        if (data.employee_activity) {
            data.employee_activity.forEach(emp => {
                total_seconds += (emp.total_seconds || 0);
                total_sessions += (emp.session_count || 0);
            });
        }

        if (data.top_applications) {
            data.top_applications.forEach(app => unique_apps.add(app.application_id));
        }

        $('#stat-total-time').text(this.format_seconds_to_time(total_seconds));
        $('#stat-sessions').text(total_sessions);
        $('#stat-apps').text(data.top_applications ? data.top_applications.length : 0);

        const avg_seconds = total_sessions > 0 ? Math.round(total_seconds / total_sessions) : 0;
        $('#stat-avg-session').text(this.format_seconds_to_time(avg_seconds));
    }

    render_hourly_chart(hourly_data) {
        if (!hourly_data) return;

        const labels = hourly_data.map(h => `${h.hour}:00`);
        const values = hourly_data.map(h => (h.total_seconds || 0) / 3600);

        new frappe.Chart("#hourly-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Activity (Hours)",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            title: "Hourly Activity",
            type: 'bar',
            height: 250,
            colors: ['#2196F3']
        });
    }

    render_top_apps(apps) {
        if (!apps) return;

        // Chart - Switched to BAR as requested
        const labels = apps.map(a => (a.applications || a.application_id || 'Unknown').substring(0, 20));
        const values = apps.map(a => (a.total_seconds || 0) / 3600);

        new frappe.Chart("#top-apps-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Hours",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            type: 'bar',
            height: 250,
            colors: ['#FFA726'] // Orange-ish like ActivityWatch
        });

        // Table
        const tbody = $('#top-apps-list tbody');
        tbody.empty();

        const total = apps.reduce((sum, a) => sum + (a.total_seconds || 0), 0);

        apps.forEach(app => {
            const percentage = total > 0 ? Math.round((app.total_seconds / total) * 100) : 0;
            const appName = app.applications || app.application_id || 'Unknown';
            const row = `
                <tr>
                    <td>${appName}</td>
                    <td class="text-right">${app.total_time}</td>
                    <td class="text-right">${percentage}%</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    render_categories(categories) {
        if (!categories) return;

        // Chart
        const labels = categories.map(c => c.category || 'Uncategorized');
        const values = categories.map(c => (c.total_seconds || 0) / 3600);

        new frappe.Chart("#top-categories-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Hours",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            type: 'bar',
            height: 250,
            colors: ['#EF5350'] // Red-ish
        });
    }

    render_window_titles(titles) {
        if (!titles) return;

        const tbody = $('#window-titles-list tbody');
        tbody.empty();

        titles.forEach(t => {
            const row = `
                <tr>
                    <td title="${t.window_title || ''}">
                        ${(t.window_title || 'Unknown').substring(0, 60)} 
                        <br><small class="text-muted">${t.application_id || ''}</small>
                    </td>
                    <td class="text-right">${t.total_time}</td>
                    <td class="text-right">${t.frequency || 0}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    render_employee_activity(employees) {
        // Keeping logic if needed but user focused on app usage
        // ... existing logic ...
    }

    render_employee_app_usage(data) {
        if (!data) return;

        const tbody = $('#table-emp-app-usage tbody');
        tbody.empty();

        data.forEach(row => {
            const html = `
                <tr>
                    <td>${row.employee_name || row.employee}</td>
                    <td>${row.applications || row.application_id || 'Unknown'}</td>
                    <td class="text-right" style="font-weight: bold;">${row.total_time}</td>
                    <td class="text-right">${row.session_count}</td>
                </tr>
            `;
            tbody.append(html);
        });
    }

    format_seconds_to_time(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds === null) return "00:00:00";

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }
}